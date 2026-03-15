-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_points integer default 0,
  current_gym_badge_count integer default 0,
  revives_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BADGES
create table public.badges (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  badge_index integer not null,
  is_obtained boolean default false,
  obtained_at timestamp with time zone,
  unique(profile_id, badge_index)
);

-- DEAD POKEMON (Caja de Muertos / Ultratumba)
create type pokemon_status as enum ('dead', 'ultratumba');

create table public.dead_pokemon (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  status pokemon_status default 'dead' not null,
  death_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EVENTS (Log of all point changes)
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- Muerte, Ventaja, Medalla, Otros
  points_change integer not null,
  description text,
  event_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ACTIVE EFFECTS (Current Advantages/Disadvantages)
create table public.active_effects (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  label text not null,
  color text not null, -- Hex color code
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROULETTE LOGS
create table public.roulette_logs (
  id uuid default uuid_generate_v4() primary key,
  spinner_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade,
  effect_name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POKEMON TEAM (Active team members)
create table public.pokemon_team (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  slot_index integer not null check (slot_index >= 0 and slot_index <= 5),
  pokemon_name text not null,
  sprite_url text not null,
  unique(profile_id, slot_index)
);

-- RULES
create table public.rules (
  id uuid default uuid_generate_v4() primary key,
  rule_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.badges enable row level security;
alter table public.dead_pokemon enable row level security;
alter table public.events enable row level security;
alter table public.active_effects enable row level security;
alter table public.roulette_logs enable row level security;
alter table public.rules enable row level security;

-- Policies (Allow all for rapid MVP development, restrict later if needed)
create policy "Allow public read access" on public.profiles for select using (true);
create policy "Allow public read access" on public.badges for select using (true);
create policy "Allow public read access" on public.dead_pokemon for select using (true);
create policy "Allow public read access" on public.events for select using (true);
create policy "Allow public read access" on public.active_effects for select using (true);
create policy "Allow public read access" on public.roulette_logs for select using (true);
create policy "Allow public read access" on public.rules for select using (true);

create policy "Allow public insert" on public.profiles for insert with check (true);
create policy "Allow public insert" on public.badges for insert with check (true);
create policy "Allow public insert" on public.dead_pokemon for insert with check (true);
create policy "Allow public insert" on public.events for insert with check (true);
create policy "Allow public insert" on public.active_effects for insert with check (true);
create policy "Allow public insert" on public.roulette_logs for insert with check (true);
create policy "Allow public insert" on public.rules for insert with check (true);

create policy "Allow public update" on public.profiles for update using (true);
create policy "Allow public update" on public.badges for update using (true);
create policy "Allow public update" on public.dead_pokemon for update using (true);
create policy "Allow public update" on public.rules for update using (true);
create policy "Allow public delete" on public.events for delete using (true);
create policy "Allow public delete" on public.active_effects for delete using (true);
create policy "Allow public delete" on public.rules for delete using (true);
