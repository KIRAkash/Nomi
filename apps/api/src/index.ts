import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { golden } from './golden';
import { guest } from './guest';
import { staff } from './staff';
import { voice } from './voice';

const app = new Hono()
  .use(logger())
  .use(cors({ origin: (o) => o ?? '*' }))
  .get('/health', (c) => c.json({ ok: true }))
  .route('/t', guest)
  .route('/golden', golden)
  .route('/voice', voice)
  .route('/staff', staff);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`nomi api on http://localhost:${port}`));
