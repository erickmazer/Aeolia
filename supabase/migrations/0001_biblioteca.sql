-- Biblioteca Musical — schema inicial (multiusuário)
-- ========================================================
-- Rode isto no seu projeto Supabase (SQL Editor) OU via `supabase db push`.
-- Técnicas, contextos e status NÃO são tabelas — são um catálogo fixo em código
-- (app/biblioteca/_lib/data.ts). O banco guarda só as músicas de cada usuário.

-- ── profiles ────────────────────────────────────────────────────────────────
-- Uma linha por usuário autenticado. `is_showcase` marca a biblioteca que
-- aparece na página pública /biblioteca (a sua).
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique,
  display_name  text,
  is_showcase   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── songs ───────────────────────────────────────────────────────────────────
create table if not exists public.songs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  title              text not null,
  artist             text not null,
  difficulty         int  not null check (difficulty between 1 and 5),
  status             text not null default 'quero-aprender'
                       check (status in ('quero-aprender', 'aprendendo', 'dominada')),
  techniques         text[] not null default '{}',
  contexts           text[] not null default '{}',
  prerequisite_ids   uuid[] not null default '{}',
  next_song_ids      uuid[] not null default '{}',
  best_version_label text,
  best_version_url   text,
  best_lesson_label  text,
  best_lesson_url    text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists songs_user_id_idx on public.songs (user_id);

-- ── updated_at automático ─────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists songs_touch_updated_at on public.songs;
create trigger songs_touch_updated_at
  before update on public.songs
  for each row execute function public.touch_updated_at();

-- ── cria um profile quando um usuário se cadastra ───────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.songs    enable row level security;

-- profiles: qualquer um pode ver profiles de vitrine; você vê/edita o seu.
drop policy if exists profiles_select_showcase on public.profiles;
create policy profiles_select_showcase on public.profiles
  for select using (is_showcase = true);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- songs: leitura pública das músicas de vitrine; leitura/escrita das suas.
drop policy if exists songs_select_showcase on public.songs;
create policy songs_select_showcase on public.songs
  for select using (
    user_id in (select id from public.profiles where is_showcase = true)
  );

drop policy if exists songs_select_own on public.songs;
create policy songs_select_own on public.songs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists songs_insert_own on public.songs;
create policy songs_insert_own on public.songs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists songs_update_own on public.songs;
create policy songs_update_own on public.songs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists songs_delete_own on public.songs;
create policy songs_delete_own on public.songs
  for delete to authenticated using (auth.uid() = user_id);

-- Para marcar sua conta como a vitrine pública, depois do primeiro login rode:
--   update public.profiles set is_showcase = true where id = '<seu-user-id>';
