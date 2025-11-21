import express from 'express';
import cors from 'cors';
import db from './db.js';

import { bot, getLastChatId } from './telegram.js';

const app = express();
app.use(cors());

app.post('/api/register_chat', express.json(), async (req, res) => {
  const { chat_id } = req.body;

  try {
    await db.query(
      'UPDATE tracked_coins SET chat_id = $1 WHERE chat_id IS NULL',
      [chat_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error saving chat_id:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/check-chat', async (req, res) => {
  const result = await db.query('SELECT chat_id FROM telegram_users LIMIT 1');
  res.json({ chat_connected: result.rows.length > 0 });
});

async function saveCryptosToDB(data) {
  const query = `
    INSERT INTO cryptos (coin_id, symbol, name, current_price, price_change_24h, market_cap_rank)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (coin_id)
    DO UPDATE SET 
      current_price = EXCLUDED.current_price,
      price_change_24h = EXCLUDED.price_change_24h,
      market_cap_rank = EXCLUDED.market_cap_rank,
      updated_at = NOW();
  `;

  for (const c of data) {
    try {
      await db.query(query, [
        c.id,
        c.symbol,
        c.name,
        c.current_price,
        c.price_change_percentage_24h,
        c.market_cap_rank,
      ]);
    } catch (err) {
      console.error(`❌ DB insert error for ${c.id}:`, err.message);
    }
  }
  console.log('💾 Saved cryptos to DB');
}

async function savePriceHistory(data) {
  const query = `
    INSERT INTO crypto_history (coin_id, price)
    VALUES ($1, $2);
  `;

  for (const c of data) {
    try {
      await db.query(query, [c.id, c.current_price]);
    } catch (err) {
      console.error(`❌ History insert error for ${c.id}:`, err.message);
    }
  }
  console.log('📈 Saved price history to DB');
}

app.get('/api/local-cryptos', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cryptos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB fetch error' });
  }
});

let cache = {
  data: null,
  timestamp: 0,
};

app.get('/api/history/:coin_id', async (req, res) => {
  const { coin_id } = req.params;
  try {
    const result = await db.query(
      'SELECT price, recorded_at FROM crypto_history WHERE coin_id = $1 ORDER BY recorded_at DESC LIMIT 100',
      [coin_id]
    );
    res.json(result.rows.reverse());
  } catch (err) {
    console.error('❌ DB history fetch error:', err.message);
    res.status(500).json({ error: 'DB history fetch error' });
  }
});

app.get('/api/cryptos', async (req, res) => {
  const now = Date.now();

  if (cache.data && now - cache.timestamp < 60_000) {
    console.log('🟢 Serving from cache');
    return res.json(cache.data);
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&sparkline=true'
    );

    if (!response.ok) throw new Error(`CoinGecko error ${response.status}`);

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('❌ CoinGecko returned non-array:', data);
      return res.status(502).json({ error: 'Invalid response from CoinGecko' });
    }

    cache = { data, timestamp: now };
    res.json(data);
  } catch (error) {
    console.error('❌ /api/cryptos ERROR:', error.message);
    res.status(500).json({ error: 'Failed to fetch crypto data' });
  }
});

const detailsCache = new Map();

app.get('/api/cryptos/:id/details', async (req, res) => {
  const { id } = req.params;

  if (detailsCache.has(id)) {
    const { data, timestamp } = detailsCache.get(id);
    if (Date.now() - timestamp < 10 * 60 * 1000) {
      console.log(`🟢 Serving ${id} details from cache`);
      return res.json(data);
    }
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}`
    );
    if (!response.ok)
      throw new Error(`CoinGecko API returned ${response.status}`);

    const data = await response.json();

    const cleaned = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      description: data.description?.en || 'No description available.',
      hashing_algorithm: data.hashing_algorithm || 'N/A',
      genesis_date: data.genesis_date || 'N/A',
      market_cap_rank: data.market_cap_rank || 'N/A',
      homepage: data.links?.homepage?.[0] || 'N/A',
    };

    detailsCache.set(id, { data: cleaned, timestamp: Date.now() });

    res.json(cleaned);
  } catch (error) {
    console.error('❌ DETAILS ERROR:', error.message);

    if (detailsCache.has(id)) {
      console.warn(`⚠️ Using cached data for ${id}`);
      return res.json(detailsCache.get(id).data);
    }

    res.status(500).json({ error: 'Failed to load details' });
  }
});

app.post('/api/tracked', express.json(), async (req, res) => {
  const { coin_id, name, symbol } = req.body;

  const user = await db.query('SELECT chat_id FROM telegram_users LIMIT 1');
  if (user.rows.length === 0) {
    return res.status(400).json({ error: 'no_chat' });
  }
  const chat_id = user.rows[0].chat_id;

  if (!chat_id) {
    return res.status(400).json({
      error: 'no_chat',
    });
  }

  try {
    await db.query(
      `INSERT INTO tracked_coins (coin_id, name, symbol, last_price, chat_id)
       VALUES ($1, $2, $3, 0, $4)
       ON CONFLICT (coin_id) DO NOTHING`,
      [coin_id, name, symbol, chat_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.log('DB ERR:', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/tracked/:coin_id', async (req, res) => {
  const { coin_id } = req.params;

  try {
    await db.query('DELETE FROM tracked_coins WHERE coin_id = $1', [coin_id]);

    res.json({ success: true, removed: coin_id });
  } catch (err) {
    console.error('❌ Error deleting tracked coin:', err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.get('/api/tracked', async (req, res) => {
  const result = await db.query('SELECT * FROM tracked_coins ORDER BY id DESC');
  res.json(result.rows);
});

app.get('/api/cryptos/:id/history', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'History fetch error' });
  }
});

import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  console.log('⏳ Updating cryptos in database...');
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&sparkline=false'
    );
    const data = await response.json();
    await saveCryptosToDB(data);
    await savePriceHistory(data);
  } catch (err) {
    console.error('❌ Cron update failed:', err.message);
  }
});

(async () => {
  console.log('🚀 Initial crypto update...');
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&sparkline=false'
    );
    const data = await response.json();
    await saveCryptosToDB(data);
  } catch (err) {
    console.error('❌ Initial update failed:', err.message);
  }
})();

async function checkPriceAlerts() {
  const tracked = await db.query(
    'SELECT * FROM tracked_coins WHERE chat_id IS NOT NULL'
  );

  for (const coin of tracked.rows) {
    const resp = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin.coin_id}&vs_currencies=usd`
    );
    const data = await resp.json();
    const price = data[coin.coin_id]?.usd;

    if (!price) continue;

    const diff = ((price - coin.last_price) / (coin.last_price || price)) * 100;

    if (Math.abs(diff) >= 0.0001) {
      const direction = diff > 0 ? '📈 Виросла' : '📉 Падає';

      bot.sendMessage(
        coin.chat_id,
        `${direction} монета *${
          coin.name
        }* (${coin.symbol.toUpperCase()})\n\nЗмiна: *${diff.toFixed(
          2
        )}%*\nПоточна ціна: *$${price}*`,
        { parse_mode: 'Markdown' }
      );
    }

    await db.query('UPDATE tracked_coins SET last_price = $1 WHERE id = $2', [
      price,
      coin.id,
    ]);
  }
}
cron.schedule('*/5 * * * *', checkPriceAlerts);

app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
