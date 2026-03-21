-- ─────────────────────────────────────────────────────────
-- FORESIGHT — Schema de base de datos
-- Pega esto en: Supabase → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────

-- USUARIOS
create table if not exists users (
  id                   uuid primary key default gen_random_uuid(),
  wallet_address       text unique not null,
  username             text unique not null,
  xp                   integer default 0,
  streak               integer default 0,
  last_prediction_date date,
  balance              numeric(12,4) default 0,
  accuracy             integer default 0,
  predictions_count    integer default 0,
  league               text default 'bronze' check (league in ('bronze','silver','gold','diamond')),
  created_at           timestamptz default now()
);

-- MERCADOS
create table if not exists markets (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  description  text,
  category     text not null check (category in ('crypto','politics','sports','science')),
  yes_pct      integer default 50,
  no_pct       integer default 50,
  pool         numeric(12,4) default 0,
  participants integer default 0,
  closes_at    timestamptz not null,
  created_by   uuid references users(id),
  resolved     boolean default false,
  result       text check (result in ('yes','no',null)),
  created_at   timestamptz default now()
);

-- PREDICCIONES
create table if not exists predictions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  market_id   uuid references markets(id) on delete cascade,
  side        text not null check (side in ('yes','no')),
  amount      numeric(10,4) not null,
  correct     boolean,
  payout      numeric(10,4) default 0,
  created_at  timestamptz default now(),
  unique(user_id, market_id)
);

-- HISTORIAL DE LIGAS (para archivar cada semana)
create table if not exists league_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  tier       text not null,
  xp         integer not null,
  rank       integer not null,
  week       date not null,
  created_at timestamptz default now()
);

-- ─── DATOS DE EJEMPLO ─────────────────────────────────────
-- Un usuario de prueba para testear sin wallet
insert into users (wallet_address, username, xp, streak, balance, accuracy, predictions_count, league)
values ('0x0000000000000000000000000000000000000001', 'test_user', 4200, 14, 142.5, 68, 89, 'gold')
on conflict (wallet_address) do nothing;

-- Mercados de ejemplo
insert into markets (question, description, category, yes_pct, no_pct, pool, participants, closes_at, resolved)
values
  ('¿Superará Ethereum los $6,000 antes de fin de año?',
   'Precio de ETH/USD en Binance al cierre del 31 de diciembre de 2026.',
   'crypto', 63, 37, 14820, 2341, now() + interval '8 days', false),

  ('¿Ganará el Real Madrid la próxima Champions League?',
   'Resuelto al finalizar la final de la UEFA Champions League 2026.',
   'sports', 28, 72, 22100, 4210, now() + interval '45 days', false),

  ('¿Publicará OpenAI un modelo GPT-5 antes de septiembre de 2026?',
   'Cualquier anuncio oficial de OpenAI con nombre GPT-5 o equivalente.',
   'science', 74, 26, 6780, 987, now() + interval '163 days', false),

  ('¿Alcanzará Bitcoin los $200,000 en 2026?',
   'Precio de BTC/USD en cualquier exchange top-5 por volumen.',
   'crypto', 41, 59, 38400, 6120, now() + interval '287 days', false)
on conflict do nothing;
