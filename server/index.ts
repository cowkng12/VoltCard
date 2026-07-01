import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(dirname, '../dist');

const cardRequestSchema = z.object({
  productId: z.enum(['subscriptions', 'wallet-pay']),
  holderName: z.string().min(3),
  deposit: z.number().min(10)
});

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'voltcard-api' });
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
});
