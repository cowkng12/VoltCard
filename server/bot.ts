import 'dotenv/config';
import { Markup, Telegraf } from 'telegraf';

const token = process.env.BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL;

if (!token) {
  throw new Error('BOT_TOKEN is required');
}

if (!miniAppUrl) {
  throw new Error('MINI_APP_URL is required');
}

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  await ctx.reply(
    'Welcome to VoltCard. Create premium virtual cards for subscriptions, wallets and secure online payments.',
    Markup.inlineKeyboard([Markup.button.webApp('Open VoltCard', miniAppUrl)])
  );
});

bot.command('app', async (ctx) => {
  await ctx.reply('Launch your VoltCard Mini App.', Markup.inlineKeyboard([Markup.button.webApp('Open Mini App', miniAppUrl)]));
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
