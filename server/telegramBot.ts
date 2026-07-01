import { Markup, Telegraf } from 'telegraf';

export function startTelegramBot(token: string, miniAppUrl: string) {
  const bot = new Telegraf(token);

  const mainMenu = Markup.inlineKeyboard([
    [Markup.button.webApp('Open VoltCard', miniAppUrl)],
    [Markup.button.callback('Our channel', 'channel_soon')],
    [Markup.button.url('Support', 'https://t.me/ilLemf')],
    [Markup.button.callback('Language', 'language_menu')]
  ]);

  const welcomeText = [
    'Hi! Welcome to VoltCard.',
    '',
    'What are these cards?',
    '',
    'We currently offer two premium card types:',
    '',
    'Universal card for everyday life, Apple Pay / Google Pay and travel-style payments.',
    '',
    'Online card for subscriptions and digital services: ChatGPT, Netflix, Spotify, iCloud, SaaS tools and work platforms.',
    '',
    'How to top up?',
    'Add balance in the Mini App, then use your card balance for online payments or crypto investments.',
    '',
    'Issue your card in a few minutes inside the Mini App.'
  ].join('\n');

  async function sendMainMenu(chatId: number) {
    await bot.telegram.sendMessage(chatId, welcomeText, mainMenu);
  }

  bot.start(async (ctx) => {
    await ctx.reply(
      'Before using VoltCard, please confirm that you agree to the processing of your Telegram profile data for Mini App access, account security and service notifications.',
      Markup.inlineKeyboard([[Markup.button.callback('I agree', 'accept_terms')]])
    );
  });

  bot.command('app', async (ctx) => {
    await ctx.reply('Launch VoltCard Mini App.', Markup.inlineKeyboard([[Markup.button.webApp('Open Mini App', miniAppUrl)]]));
  });

  bot.action('accept_terms', async (ctx) => {
    await ctx.answerCbQuery('Agreement accepted');
    if (ctx.chat) await sendMainMenu(ctx.chat.id);
  });

  bot.action('channel_soon', async (ctx) => {
    await ctx.answerCbQuery('Coming soon');
    await ctx.reply('Our channel is coming soon. We will announce product updates, new card types and investment features there.');
  });

  bot.action('language_menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      'Choose interface language:',
      Markup.inlineKeyboard([
        [Markup.button.callback('Русский', 'language_ru'), Markup.button.callback('English', 'language_en')]
      ])
    );
  });

  bot.action('language_ru', async (ctx) => {
    await ctx.answerCbQuery('Русский выбран');
    await ctx.reply('Русский язык выбран. Полная локализация Mini App скоро появится.');
  });

  bot.action('language_en', async (ctx) => {
    await ctx.answerCbQuery('English selected');
    await ctx.reply('English selected. The Mini App currently uses English as the primary interface language.');
  });

  bot.launch();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}
