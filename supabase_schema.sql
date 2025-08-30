-- Supabase schema for Nubbin™
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
