// Public guest routes, scoped by table token and rate limited. No sign-in, no cookies.
import { recogniseDish } from '@nomi/models';
import type { GuestPage } from '@nomi/shared';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from './db';

const hits = new Map<string, number[]>();
/** At most `max` requests per key in the last `windowMs`. */
function limited(key: string, max = 20, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

async function tableFor(token: string) {
  const { data } = await db.from('tables').select('id, label, restaurant_id, restaurants(id, name, brand_kit)').eq('qr_token', token).eq('active', true).maybeSingle();
  return data;
}

async function currentShift(restaurantId: string, timezone = 'Asia/Kolkata') {
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const { data } = await db.from('shifts').select('id, name, start_time, end_time').eq('restaurant_id', restaurantId);
  return data?.find((s) => s.start_time.slice(0, 5) <= now && now <= s.end_time.slice(0, 5)) ?? null;
}

const FeedbackBody = z.object({
  dish_ids: z.array(z.guid()).max(12),
  ratings: z.record(z.string(), z.number().int().min(1).max(5)),
  answers: z.record(z.string(), z.enum(['yes', 'no'])),
  text: z.string().max(2000).optional(),
  photo_dish_id: z.guid().nullable().optional(),
  language: z.string().max(12).optional(),
});

export const guest = new Hono()
  .get('/:token', async (c) => {
    const t = await tableFor(c.req.param('token'));
    if (!t) return c.json({ error: 'unknown table' }, 404);
    const r = t.restaurants as unknown as { id: string; name: string; brand_kit: { logo_url?: string } };
    const [{ data: dishes }, shift] = await Promise.all([
      db.from('dishes').select('id, name, category, icon_url, guest_questions').eq('restaurant_id', r.id).eq('active', true).order('category'),
      currentShift(r.id),
    ]);
    const page: GuestPage = {
      restaurant: { id: r.id, name: r.name, logo_url: r.brand_kit?.logo_url ?? null },
      table: { id: t.id, label: t.label },
      shift: shift?.name ?? null,
      dishes: dishes ?? [],
    };
    return c.json(page);
  })
  .post('/:token/feedback', async (c) => {
    const token = c.req.param('token');
    const ip = c.req.header('x-forwarded-for') ?? 'local';
    if (limited(`fb:${token}:${ip}`, 6)) return c.json({ error: 'slow down' }, 429);
    const t = await tableFor(token);
    if (!t) return c.json({ error: 'unknown table' }, 404);
    const body = FeedbackBody.safeParse(await c.req.json());
    if (!body.success) return c.json({ error: 'bad feedback', issues: body.error.issues }, 400);
    const shift = await currentShift(t.restaurant_id);
    const { data, error } = await db.from('feedback').insert({
      restaurant_id: t.restaurant_id, table_id: t.id, shift_id: shift?.id ?? null, ...body.data,
    }).select('id').single();
    if (error) return c.json({ error: error.message }, 500);
    // Transcription, tagging, photo scoring and reply drafting run as background jobs on feedback.created.
    return c.json({ id: data.id });
  })
  .post('/:token/recognise', async (c) => {
    const token = c.req.param('token');
    if (limited(`rec:${token}:${c.req.header('x-forwarded-for') ?? 'local'}`, 10)) return c.json({ error: 'slow down' }, 429);
    const t = await tableFor(token);
    if (!t) return c.json({ error: 'unknown table' }, 404);
    const { photo } = z.object({ photo: z.string().startsWith('data:image/').max(8_000_000) }).parse(await c.req.json());
    const { data: menu } = await db.from('dishes').select('id, name').eq('restaurant_id', t.restaurant_id).eq('active', true);
    const result = await recogniseDish({ restaurant_id: t.restaurant_id, purpose: 'guest_dish_recognition' }, photo, menu ?? []);
    return c.json(result);
  });
