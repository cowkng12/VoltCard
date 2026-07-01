import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { startTelegramBot } from './telegramBot';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(dirname, '../dist');

const cardRequestSchema = z.object({
  productId: z.enum(['subscriptions', 'wallet-pay']),
  holderName: z.string().min(3),
  deposit: z.number().min(10)
});

const fallbackMarket = [
  { symbol: 'USDT', name: 'Tether USD', price: 1, change: 0.01, marketCap: 112000000000, volume: 42000000000 },
  { symbol: 'TON', name: 'Toncoin', price: 7.24, change: 4.82, marketCap: 18000000000, volume: 610000000 },
  { symbol: 'BTC', name: 'Bitcoin', price: 64280, change: 2.34, marketCap: 1260000000000, volume: 31000000000 },
  { symbol: 'ETH', name: 'Ethereum', price: 3510, change: 1.76, marketCap: 421000000000, volume: 15000000000 },
  { symbol: 'SOL', name: 'Solana', price: 148.8, change: 5.15, marketCap: 69000000000, volume: 2800000000 }
];

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'voltcard-api' });
});

app.get('/api/market', async (_request, response) => {
  const ids = 'tether,the-open-network,bitcoin,ethereum,solana';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h`;

  try {
    const marketResponse = await fetch(url, { headers: { accept: 'application/json' } });

    if (!marketResponse.ok) {
      throw new Error(`CoinGecko responded with ${marketResponse.status}`);
    }

    const data = (await marketResponse.json()) as Array<{
      symbol: string;
      name: string;
      current_price: number;
      price_change_percentage_24h: number | null;
      market_cap: number;
      total_volume: number;
    }>;

    const symbols = ['USDT', 'TON', 'BTC', 'ETH', 'SOL'];
    const market = symbols.map((symbol) => {
      const item = data.find((coin) => coin.symbol.toUpperCase() === symbol);
      const fallback = fallbackMarket.find((coin) => coin.symbol === symbol)!;

      return {
        symbol,
        name: item?.name ?? fallback.name,
        price: item?.current_price ?? fallback.price,
        change: item?.price_change_percentage_24h ?? fallback.change,
        marketCap: item?.market_cap ?? fallback.marketCap,
        volume: item?.total_volume ?? fallback.volume
      };
    });

    response.json({ source: 'coingecko', updatedAt: new Date().toISOString(), market });
  } catch (error) {
    response.json({ source: 'fallback', updatedAt: new Date().toISOString(), market: fallbackMarket });
  }
});

app.post('/api/cards', (request, response) => {
  const result = cardRequestSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: 'Invalid card request', details: result.error.flatten() });
    return;
  }

  const { productId, holderName, deposit } = result.data;

  response.status(201).json({
    id: crypto.randomUUID(),
    productId,
    holderName: holderName.toUpperCase(),
    balance: deposit,
    status: 'active',
    createdAt: new Date().toISOString()
  });
});

app.use(express.static(clientDistPath));

app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`VoltCard API listening on http://localhost:${port}`);

  if (process.env.BOT_TOKEN && process.env.MINI_APP_URL) {
    startTelegramBot(process.env.BOT_TOKEN, process.env.MINI_APP_URL);
    console.log('VoltCard Telegram bot started');
  } else {
    console.log('VoltCard Telegram bot skipped: BOT_TOKEN and MINI_APP_URL are not set');
  }
});
