-- Nomi core schema (spec section 9.1). Every row belongs to a restaurant; RLS limits members to their own restaurants.
-- Guests never touch these tables directly: the API serves /t/:token with the service key.

create extension if not exists pgcrypto;

create type role as enum ('owner', 'head_chef', 'manager', 'staff');

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text,
  city text,
  timezone text not null default 'Asia/Kolkata',
  brand_kit jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  user_id uuid references auth.users on delete set null,
  phone text,
  roles role[] not null,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  label text not null,
  qr_token text not null unique default encode(gen_random_bytes(9), 'base64'),
  active boolean not null default true
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null
);

create table dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  name text not null,
  category text,
  price numeric,
  description text,
  veg boolean,
  components jsonb not null default '[]',      -- [{name, sam_prompt, role}]
  icon_url text,                                -- Muse Image icon from the Golden Plate photo
  guest_questions jsonb not null default '[]',  -- up to 3 [{id, text, yes_label, no_label, checks}]
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table pass_calibrations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  device_id text not null,
  plate_px_diameter numeric not null,
  crop_box jsonb not null,
  reference_photo text not null,
  created_at timestamptz not null default now()
);

create table sop_cards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  dish_id uuid not null references dishes on delete cascade,
  image_url text,
  rules jsonb not null default '[]',
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'approved'))
);

create table golden_plates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  dish_id uuid not null references dishes on delete cascade,
  version int not null,
  calibration_id uuid references pass_calibrations,
  photos text[] not null,
  masks jsonb not null default '[]',
  signature jsonb not null default '[]',  -- per component: present, area_share, angle_deg, radius, count, tolerance
  rules jsonb not null default '[]',
  sop_card_id uuid references sop_cards,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (dish_id, version)
);

create table plate_captures (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  dish_id uuid references dishes,
  golden_plate_id uuid references golden_plates,
  shift_id uuid references shifts,
  frame_url text not null,
  masks jsonb,
  score int check (score between 0 and 100),
  reasons text[] not null default '{}',
  captured_at timestamptz not null default now()
);

create table guest_refs (
  id uuid primary key default gen_random_uuid(),
  phone_hash text not null unique,
  phone_encrypted text not null,
  language text,
  consent_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  title text not null,
  category text not null,
  dish_id uuid references dishes,
  status text not null default 'open' check (status in ('open', 'resolved')),
  evidence jsonb not null default '{}',  -- {feedback_ids, capture_ids, closing_ids}
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  table_id uuid references tables,
  shift_id uuid references shifts,
  dish_ids uuid[] not null default '{}',
  ratings jsonb not null default '{}',   -- dish id (or "overall") → 1..5
  answers jsonb not null default '{}',   -- guest question id → yes | no
  text text,
  audio_url text,
  transcript text,
  translation text,
  language text,
  photo_url text,
  photo_dish_id uuid references dishes,
  photo_score int,
  tags jsonb,
  sentiment text,
  severity text check (severity in ('low', 'medium', 'high')),
  issue_id uuid references issues,
  guest_ref uuid references guest_refs,
  created_at timestamptz not null default now()
);

create table replies (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  feedback_id uuid not null references feedback on delete cascade,
  draft text not null,
  draft_en text,
  final_text text,
  status text not null default 'drafted' check (status in ('drafted', 'approved', 'sent')),
  approved_by uuid references auth.users
);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  name text not null,
  sam_prompt text not null,
  unit text not null default 'item',  -- always a whole, countable thing: sack, tin, packet, box
  min_level int
);

create table stock_snapshots (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  photo_urls text[] not null,
  counts jsonb not null,  -- stock item id → whole count
  taken_at timestamptz not null default now()
);

-- Closing photo round: only what is visible. No amounts, weights or money.
create table closing_checks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  round_date date not null,
  spot text not null,
  photo_url text not null,
  after_photo_url text,
  counts jsonb not null default '[]',  -- [{item, n}]
  flags jsonb not null default '[]',   -- [{flag, where, box, fixed}]
  taken_by uuid references auth.users,
  taken_at timestamptz not null default now()
);

create table handovers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  shift_id uuid references shifts,
  audio_url text,
  transcript jsonb,  -- speaker turns
  summary jsonb,     -- {done, pending, problems}
  created_at timestamptz not null default now()
);

create table actions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  source text not null check (source in ('nightshift', 'echo')),
  type text not null check (type in ('update_sop', 'adjust_order', 'reply_guest')),
  payload jsonb not null,
  evidence_ids text[] not null default '{}',
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'done')),
  approved_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create table briefings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  date date not null,
  summary jsonb not null,
  action_ids uuid[] not null default '{}',
  unique (restaurant_id, date)
);

create table model_calls (
  id bigint generated always as identity primary key,
  restaurant_id uuid references restaurants on delete set null,
  model text not null,
  purpose text not null,
  tokens_in int,
  tokens_out int,
  latency_ms int not null,
  ok boolean not null,
  created_at timestamptz not null default now()
);

create index on feedback (restaurant_id, created_at desc);
create index on plate_captures (restaurant_id, dish_id, captured_at desc);
create index on closing_checks (restaurant_id, round_date desc);

-- Membership helpers used by every policy
create function is_member(r uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.restaurant_id = r and m.user_id = auth.uid())
$$;
create function has_role(r uuid, wanted role[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.restaurant_id = r and m.user_id = auth.uid() and m.roles && wanted)
$$;

alter table restaurants enable row level security;
create policy "members read" on restaurants for select using (is_member(id));
create policy "owner or manager edits" on restaurants for update using (has_role(id, '{owner,manager}'));

do $$
declare t text;
begin
  -- Read access for every member of the restaurant
  foreach t in array array['members','tables','shifts','dishes','pass_calibrations','sop_cards','golden_plates','plate_captures','issues','feedback','replies','stock_items','stock_snapshots','closing_checks','handovers','actions','briefings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "members read" on %I for select using (is_member(restaurant_id))', t);
  end loop;
end $$;

-- Writes follow the permissions table in spec section 2
create policy "owner/manager manage team" on members for all using (has_role(restaurant_id, '{owner,manager}'));
create policy "owner/manager manage tables" on tables for all using (has_role(restaurant_id, '{owner,manager}'));
create policy "owner/manager manage shifts" on shifts for all using (has_role(restaurant_id, '{owner,manager}'));
create policy "chef edits menu" on dishes for all using (has_role(restaurant_id, '{head_chef}'));
create policy "chef calibrates" on pass_calibrations for all using (has_role(restaurant_id, '{head_chef}'));
create policy "chef edits golden plates" on golden_plates for all using (has_role(restaurant_id, '{head_chef}'));
create policy "chef approves sop" on sop_cards for all using (has_role(restaurant_id, '{head_chef}'));
create policy "owner/manager handle replies" on replies for update using (has_role(restaurant_id, '{owner,manager}'));
create policy "owner/manager resolve issues" on issues for update using (has_role(restaurant_id, '{owner,manager}'));
create policy "manager edits stock" on stock_items for all using (has_role(restaurant_id, '{manager}'));
create policy "manager logs stock" on stock_snapshots for insert with check (has_role(restaurant_id, '{manager}'));
create policy "staff take closing photos" on closing_checks for insert with check (is_member(restaurant_id));
create policy "staff fix closing flags" on closing_checks for update using (is_member(restaurant_id));
create policy "staff record handovers" on handovers for insert with check (is_member(restaurant_id));
create policy "owner/manager approve actions" on actions for update using (has_role(restaurant_id, '{owner,manager}'));

alter table guest_refs enable row level security;  -- service key only
alter table model_calls enable row level security;
create policy "owner reads costs" on model_calls for select using (has_role(restaurant_id, '{owner}'));

-- Live inbox and alerts
alter publication supabase_realtime add table feedback, plate_captures, actions;
