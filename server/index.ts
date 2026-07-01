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
const keepAliveIntervalMs = 1000 * 60 * 10;

const cardRequestSchema = z.object({
  productId: z.enum(['subscriptions', 'wallet-pay']),
  holderName: z.string().min(3),
  deposit: z.number().min(10)
});

const fallbackMarket = [
  { symbol: 'USDT', name: 'Tether USD', price: 1, change: 0.01, marketCap: 112000000000, volume: 42000000000, sparkline: [0.999, 1, 1.001, 1, 1.002, 1.001, 1] },
  { symbol: 'TON', name: 'Toncoin', price: 7.24, change: 4.82, marketCap: 18000000000, volume: 610000000, sparkline: [6.74, 6.82, 6.9, 6.86, 7.02, 7.14, 7.24] },
  { symbol: 'BTC', name: 'Bitcoin', price: 64280, change: 2.34, marketCap: 1260000000000, volume: 31000000000, sparkline: [61200, 61850, 60640, 62530, 63110, 63840, 64280] },
  { symbol: 'ETH', name: 'Ethereum', price: 3510, change: 1.76, marketCap: 421000000000, volume: 15000000000, sparkline: [3370, 3425, 3398, 3460, 3488, 3502, 3510] },
  { symbol: 'SOL', name: 'Solana', price: 148.8, change: 5.15, marketCap: 69000000000, volume: 2800000000, sparkline: [136, 138.2, 141.6, 140.4, 144.8, 146.1, 148.8] }
];

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'voltcard-api' });
});

app.get('/api/market', async (_request, response) => {
  const ids = 'tether,the-open-network,bitcoin,ethereum,solana';
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=5&page=1&sparkline=true&price_change_percentage=24h`;

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
      sparkline_in_7d?: { price: number[] };
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
        volume: item?.total_volume ?? fallback.volume,
        sparkline: item?.sparkline_in_7d?.price?.length ? item.sparkline_in_7d.price : fallback.sparkline
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

  if (process.env.KEEP_ALIVE === 'true') {
    const serviceUrl = process.env.RENDER_EXTERNAL_URL ?? process.env.MINI_APP_URL;

    if (serviceUrl) {
      setInterval(async () => {
        try {
          await fetch(`${serviceUrl.replace(/\/$/, '')}/health`);
        } catch {
          console.warn('VoltCard keep-alive ping failed');
        }
      }, keepAliveIntervalMs);

      console.log(`VoltCard keep-alive enabled for ${serviceUrl}`);
    } else {
      console.log('VoltCard keep-alive skipped: RENDER_EXTERNAL_URL or MINI_APP_URL is not set');
    }
  }
});
