import { useEffect, useState } from 'react';

export default function Watchlist() {
  const [coins, setCoins] = useState([]);

  async function load() {
    const res = await fetch('http://localhost:5000/api/tracked');
    const tracked = await res.json();

    const ids = tracked.map((c) => c.coin_id).join(',');

    if (!ids) {
      setCoins([]);
      return;
    }

    const full = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`
    );
    const fullData = await full.json();

    setCoins(fullData);
  }

  async function removeCoin(coin_id) {
    try {
      await fetch(`http://localhost:5000/api/tracked/${coin_id}`, {
        method: 'DELETE',
      });

      setCoins(coins.filter((c) => c.id !== coin_id));
    } catch (err) {
      console.error('Remove error:', err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Watchlist</h1>

      <div className="bg-white dark:bg-[#161b22] rounded-xl p-4 shadow">
        {coins.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No coins in watchlist
          </p>
        ) : (
          coins.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b border-gray-700 py-3"
            >
              <div className="flex items-center gap-3">
                <img src={c.image} className="w-7 h-7" />
                <span className="text-lg text-black dark:text-white">
                  {c.name} ({c.symbol.toUpperCase()})
                </span>
              </div>

              <div className="flex items-center gap-8">
                <span className="text-black dark:text-gray-300">
                  ${c.current_price.toLocaleString()}
                </span>

                <span
                  className={
                    c.price_change_percentage_24h > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {c.price_change_percentage_24h.toFixed(2)}%
                </span>

                <button
                  onClick={() => removeCoin(c.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
