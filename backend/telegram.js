import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

let lastChatId = null;

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

bot.onText(/\/start/, async (msg) => {
  lastChatId = msg.chat.id;

  console.log('🔥 USER STARTED BOT. chat_id =', lastChatId);

  await db.query(
    `
    INSERT INTO telegram_users (chat_id)
    VALUES ($1)
    ON CONFLICT (chat_id) DO NOTHING
  `,
    [lastChatId]
  );

  bot.sendMessage(
    lastChatId,
    '✅ Сповіщення активовані! Тепер повертайтесь на сайт і додавайте монети у Watchlist.'
  );
});

export function getLastChatId() {
  return lastChatId;
}
