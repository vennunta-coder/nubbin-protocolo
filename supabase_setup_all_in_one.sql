-- Nubbin™ — Setup completo (schema + índices + RLS DEV)
begin;

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  age int,
  location text,
  created_at timestamp default now()
);

create table if not exists progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  level int not null,
  completed boolean default false,
  updated_at timestamp default now()
);

create table if not exists ranking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  score int not null,
  created_at timestamp default now()
);

create index if not exists idx_progress_user on progress(user_id);
create unique index if not exists uq_progress_user_level on progress(user_id, level);
create index if not exists idx_ranking_score on ranking(score desc);

commit;

alter table users enable row level security;
alter table progress enable row level security;
alter table ranking enable row level security;

drop policy if exists users_select_all on users;
drop policy if exists users_insert_all on users;
drop policy if exists users_update_all on users;

create policy users_select_all on users for select using (true);
create policy users_insert_all on users for insert with check (true);
create policy users_update_all on users for update using (true) with check (true);

drop policy if exists progress_select_all on progress;
drop policy if exists progress_insert_all on progress;
drop policy if exists progress_update_all on progress;

create policy progress_select_all on progress for select using (true);
create policy progress_insert_all on progress for insert with check (true);
create policy progress_update_all on progress for update using (true) with check (true);

drop policy if exists ranking_select_all on ranking;
drop policy if exists ranking_insert_all on ranking;

create policy ranking_select_all on ranking for select using (true);
create policy ranking_insert_all on ranking for insert with check (true);
