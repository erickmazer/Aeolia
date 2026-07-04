-- Biblioteca (Aeolia) — split canônico + personalização (Fase 1)
-- ================================================================
-- Separa a tabela `songs` (hoje 1 cópia por usuário) em:
--   • canonical_songs  — dados objetivos da música, compartilhados/deduplicados.
--   • library_entries  — a relação de cada usuário com a música (status, árvore
--                        pessoal, e um cache de personalização para a Fase 2).
--
-- NÃO edita a 0001. `public.songs` é mantida intacta como rede de segurança;
-- um 0003 futuro pode dropá-la depois de validar. Rode no SQL Editor do
-- Supabase (ou `supabase db push`) UMA vez — os `on conflict do nothing`/`if
-- not exists` tornam re-execuções seguras.

-- ── unaccent + wrapper imutável (p/ dedup acento-insensível) ─────────────────
create extension if not exists unaccent;

-- unaccent() é STABLE (não pode ir direto numa generated column). A forma de 2
-- args (dicionário explícito) é determinística → seguro marcar IMMUTABLE.
create or replace function public.immutable_unaccent(text)
returns text
language sql immutable strict
set search_path = extensions, public, pg_temp
as $$ select unaccent('unaccent', $1) $$;

-- ── canonical_songs ─────────────────────────────────────────────────────────
create table if not exists public.canonical_songs (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  artist             text not null,
  -- chave de dedup: lower(unaccent("title")) :: lower(unaccent("artist"))
  dedup_key          text generated always as (
                       lower(public.immutable_unaccent(title)) || '::' ||
                       lower(public.immutable_unaccent(artist))
                     ) stored,
  difficulty         int  not null check (difficulty between 1 and 5),
  techniques         text[] not null default '{}',
  contexts           text[] not null default '{}',
  best_version_label text,
  best_version_url   text,
  best_lesson_label  text,
  best_lesson_url    text,
  notes              text,
  contributor_count  int  not null default 1,   -- quantos usuários têm a música
  verified           boolean not null default false, -- ficha vetada (curadoria)
  created_by         uuid references auth.users on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists canonical_songs_dedup_key_idx
  on public.canonical_songs (dedup_key);

-- ── library_entries ─────────────────────────────────────────────────────────
create table if not exists public.library_entries (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users on delete cascade,
  song_id               uuid not null references public.canonical_songs on delete cascade,
  status                text not null default 'quero-aprender'
                          check (status in ('quero-aprender','aprendendo','dominada')),
  personal_note         text,
  -- árvore pessoal (refs canonical_songs.id) — cada um monta a sua
  prerequisite_song_ids uuid[] not null default '{}',
  next_song_ids         uuid[] not null default '{}',
  -- Fase 2 (nulos por ora): fit + sugestões cacheados
  personalization       jsonb,
  personalization_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, song_id)
);
create index if not exists library_entries_user_id_idx on public.library_entries (user_id);
create index if not exists library_entries_song_id_idx on public.library_entries (song_id);

-- ── updated_at automático (reusa a função da 0001) ──────────────────────────
drop trigger if exists canonical_songs_touch_updated_at on public.canonical_songs;
create trigger canonical_songs_touch_updated_at
  before update on public.canonical_songs
  for each row execute function public.touch_updated_at();

drop trigger if exists library_entries_touch_updated_at on public.library_entries;
create trigger library_entries_touch_updated_at
  before update on public.library_entries
  for each row execute function public.touch_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.canonical_songs enable row level security;
alter table public.library_entries enable row level security;

-- canonical_songs: leitura pública (é o catálogo comunitário). Sem políticas de
-- escrita → toda escrita é negada ao cliente; acontece só via as RPCs
-- SECURITY DEFINER abaixo (o "caminho controlado").
drop policy if exists canonical_songs_select_all on public.canonical_songs;
create policy canonical_songs_select_all on public.canonical_songs
  for select using (true);

-- library_entries: leitura pública das entradas da vitrine; CRUD só das suas.
drop policy if exists library_entries_select_showcase on public.library_entries;
create policy library_entries_select_showcase on public.library_entries
  for select using (
    user_id in (select id from public.profiles where is_showcase = true)
  );

drop policy if exists library_entries_select_own on public.library_entries;
create policy library_entries_select_own on public.library_entries
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists library_entries_insert_own on public.library_entries;
create policy library_entries_insert_own on public.library_entries
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists library_entries_update_own on public.library_entries;
create policy library_entries_update_own on public.library_entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists library_entries_delete_own on public.library_entries;
create policy library_entries_delete_own on public.library_entries
  for delete to authenticated using (auth.uid() = user_id);

-- ── RPCs (caminho controlado de escrita canônica) ──────────────────────────
-- Busca uma música canônica por título+artista (acento-insensível). Leitura.
create or replace function public.find_canonical(_title text, _artist text)
returns setof public.canonical_songs
language sql stable
set search_path = public, extensions, pg_temp
as $$
  select *
  from public.canonical_songs
  where dedup_key = lower(public.immutable_unaccent(_title)) || '::' ||
                    lower(public.immutable_unaccent(_artist))
  limit 1
$$;

-- Adiciona uma música canônica existente à biblioteca do usuário logado.
create or replace function public.add_existing_to_library(_song_id uuid)
returns public.library_entries
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _entry public.library_entries;
begin
  if _uid is null then raise exception 'not authenticated'; end if;

  insert into public.library_entries (user_id, song_id)
  values (_uid, _song_id)
  on conflict (user_id, song_id) do update set updated_at = now()
  returning * into _entry;

  update public.canonical_songs c
    set contributor_count = (select count(distinct user_id)
                             from public.library_entries where song_id = _song_id)
    where c.id = _song_id;

  return _entry;
end;
$$;

-- Cria (ou reaproveita) a canônica a partir de um rascunho revisado e adiciona
-- à biblioteca do usuário logado. Retorna a library_entry criada.
create or replace function public.create_canonical_and_add(
  _title text, _artist text, _difficulty int,
  _techniques text[], _contexts text[],
  _best_version_label text, _best_version_url text,
  _best_lesson_label text, _best_lesson_url text,
  _notes text
)
returns public.library_entries
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _key text := lower(public.immutable_unaccent(_title)) || '::' ||
               lower(public.immutable_unaccent(_artist));
  _song public.canonical_songs;
  _entry public.library_entries;
begin
  if _uid is null then raise exception 'not authenticated'; end if;

  select * into _song from public.canonical_songs where dedup_key = _key;
  if not found then
    insert into public.canonical_songs
      (title, artist, difficulty, techniques, contexts,
       best_version_label, best_version_url, best_lesson_label, best_lesson_url,
       notes, created_by)
    values (_title, _artist, _difficulty, coalesce(_techniques,'{}'), coalesce(_contexts,'{}'),
       _best_version_label, _best_version_url, _best_lesson_label, _best_lesson_url,
       _notes, _uid)
    on conflict (dedup_key) do update set updated_at = now()  -- segurança em corrida
    returning * into _song;
  end if;

  insert into public.library_entries (user_id, song_id)
  values (_uid, _song.id)
  on conflict (user_id, song_id) do update set updated_at = now()
  returning * into _entry;

  update public.canonical_songs c
    set contributor_count = (select count(distinct user_id)
                             from public.library_entries where song_id = _song.id)
    where c.id = _song.id;

  return _entry;
end;
$$;

grant execute on function public.find_canonical(text, text) to anon, authenticated;
grant execute on function public.add_existing_to_library(uuid) to authenticated;
grant execute on function public.create_canonical_and_add(
  text, text, int, text[], text[], text, text, text, text, text) to authenticated;

-- ── Backfill a partir de public.songs (idempotente) ─────────────────────────
-- 1) Colapsa duplicatas por usuário em canônicas (mais recente vence).
insert into public.canonical_songs
  (title, artist, difficulty, techniques, contexts,
   best_version_label, best_version_url, best_lesson_label, best_lesson_url, notes, contributor_count)
select distinct on (lower(public.immutable_unaccent(title)) || '::' || lower(public.immutable_unaccent(artist)))
   title, artist, difficulty, techniques, contexts,
   best_version_label, best_version_url, best_lesson_label, best_lesson_url, notes, 1
from public.songs
order by lower(public.immutable_unaccent(title)) || '::' || lower(public.immutable_unaccent(artist)), updated_at desc
on conflict (dedup_key) do nothing;

-- 2) Cada songs antiga → uma library_entry apontando p/ a canônica.
insert into public.library_entries (user_id, song_id, status, created_at)
select s.user_id, c.id, s.status, s.created_at
from public.songs s
join public.canonical_songs c
  on c.dedup_key = lower(public.immutable_unaccent(s.title)) || '::' || lower(public.immutable_unaccent(s.artist))
on conflict (user_id, song_id) do nothing;

-- 3) contributor_count = usuários distintos por música.
update public.canonical_songs c
set contributor_count = sub.n
from (select song_id, count(distinct user_id) n from public.library_entries group by song_id) sub
where sub.song_id = c.id;

-- 4) Árvore pessoal: traduz prerequisite_ids/next_song_ids (uuids antigos, por
--    usuário) → uuids canônicos, gravando na library_entry do MESMO usuário.
with map as (
  select s.id as old_id, s.user_id, c.id as canon_id
  from public.songs s
  join public.canonical_songs c
    on c.dedup_key = lower(public.immutable_unaccent(s.title)) || '::' || lower(public.immutable_unaccent(s.artist))
)
update public.library_entries le
set prerequisite_song_ids = coalesce((
      select array_agg(m2.canon_id)
      from public.songs s
      join map m1 on m1.old_id = s.id
      cross join lateral unnest(s.prerequisite_ids) pid
      join map m2 on m2.old_id = pid and m2.user_id = s.user_id
      where m1.canon_id = le.song_id and s.user_id = le.user_id
    ), '{}'),
    next_song_ids = coalesce((
      select array_agg(m2.canon_id)
      from public.songs s
      join map m1 on m1.old_id = s.id
      cross join lateral unnest(s.next_song_ids) nid
      join map m2 on m2.old_id = nid and m2.user_id = s.user_id
      where m1.canon_id = le.song_id and s.user_id = le.user_id
    ), '{}')
where le.user_id in (select user_id from map);
