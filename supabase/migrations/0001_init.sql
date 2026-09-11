-- Surtify · esquema inicial
-- Basado en ARQUITECTURA.md, sección 4 (modelo de datos)

create extension if not exists "uuid-ossp";

-- Perfil de usuario (extiende auth.users de Supabase)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  driver_type text check (driver_type in ('particular', 'profesional')) default 'particular',
  level text default 'Novato',
  total_xp integer default 0,
  streak_count integer default 0,
  reputation numeric default 1.0,
  created_at timestamptz default now()
);

create table if not exists public.gas_stations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  services text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.fuel_prices (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid references public.gas_stations(id) on delete cascade,
  fuel_type text not null check (fuel_type in ('diesel', 'gasolina_95', 'gasolina_98', 'glp')),
  price numeric(5,3) not null,
  reported_by uuid references public.users(id),
  reported_at timestamptz default now()
);
create index if not exists fuel_prices_station_idx on public.fuel_prices(station_id);

create table if not exists public.price_confirmations (
  id uuid primary key default uuid_generate_v4(),
  fuel_price_id uuid references public.fuel_prices(id) on delete cascade,
  user_id uuid references public.users(id),
  vote smallint not null check (vote in (-1, 1)),
  weight numeric default 1.0,
  created_at timestamptz default now()
);

create table if not exists public.station_photos (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid references public.gas_stations(id) on delete cascade,
  user_id uuid references public.users(id),
  storage_path text not null,
  created_at timestamptz default now()
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid references public.gas_stations(id) on delete cascade,
  user_id uuid references public.users(id),
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  event_type text not null,
  xp_awarded integer not null,
  created_at timestamptz default now()
);

create table if not exists public.missions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  period text check (period in ('semanal', 'mensual')) not null,
  xp_reward integer not null,
  target_count integer not null,
  active boolean default true
);

create table if not exists public.user_missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  progress integer default 0,
  completed boolean default false,
  period_start date default current_date
);

create table if not exists public.territories (
  id uuid primary key default uuid_generate_v4(),
  zone_name text not null,
  leader_user_id uuid references public.users(id),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.fuel_prices enable row level security;
alter table public.price_confirmations enable row level security;
alter table public.station_photos enable row level security;
alter table public.comments enable row level security;
alter table public.xp_events enable row level security;
alter table public.user_missions enable row level security;

-- Lectura pública de datos de la comunidad; escritura solo del propio usuario
create policy "usuarios ven su propio perfil" on public.users
  for select using (auth.uid() = id);
create policy "usuarios actualizan su propio perfil" on public.users
  for update using (auth.uid() = id);

create policy "cualquiera puede leer precios" on public.fuel_prices
  for select using (true);
create policy "usuarios autenticados reportan precios" on public.fuel_prices
  for insert with check (auth.uid() = reported_by);

create policy "cualquiera puede leer confirmaciones" on public.price_confirmations
  for select using (true);
create policy "usuarios autenticados confirman precios" on public.price_confirmations
  for insert with check (auth.uid() = user_id);

create policy "cualquiera puede leer fotos" on public.station_photos
  for select using (true);
create policy "usuarios autenticados suben fotos" on public.station_photos
  for insert with check (auth.uid() = user_id);

create policy "cualquiera puede leer comentarios" on public.comments
  for select using (true);
create policy "usuarios autenticados comentan" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "usuarios ven sus propios eventos xp" on public.xp_events
  for select using (auth.uid() = user_id);

create policy "usuarios ven su progreso en misiones" on public.user_missions
  for select using (auth.uid() = user_id);
