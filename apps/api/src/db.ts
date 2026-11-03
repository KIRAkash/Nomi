import { onModelCall } from '@nomi/models';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_KEY;
/** False on the hosted demo, which runs without a database and serves the seed restaurant for demo tokens. */
export const hasDb = Boolean(key);
if (!hasDb) console.warn('SUPABASE_SERVICE_KEY is not set: demo tokens use seed data and nothing is saved');

// Service-role client: the API enforces token scoping itself for public guest routes.
export const db = createClient(url, key ?? 'missing', { auth: { persistSession: false } });

if (hasDb) onModelCall(async (row) => {
  const { error } = await db.from('model_calls').insert(row);
  if (error) console.warn('model_calls insert failed:', error.message);
});
