import 'dotenv/config';
import { startTelegramBot } from './telegramBot';

const token = process.env.BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL;

if (!token) {
  throw new Error('BOT_TOKEN is required');
}

if (!miniAppUrl) {
  throw new Error('MINI_APP_URL is required');
}

startTelegramBot(token, miniAppUrl);
