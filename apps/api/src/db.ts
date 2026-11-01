import { onModelCall } from '@nomi/models';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_KEY;
if (!key) console.warn('SUPABASE_SERVICE_KEY is not set: run `supabase status` and copy the service_role key into .env');

// Service-role client: the API enforces token scoping itself for public guest routes.
export const db = createClient(url, key ?? 'missing', { auth: { persistSession: false } });

onModelCall(async (row) => {
  const { error } = await db.from('model_calls').insert(row);
  if (error) console.warn('model_calls insert failed:', error.message);
});
