-- Partes/acordes no catálogo compartilhado (canônico), semeados pela IA ao criar
-- a música. Quem adiciona a música herda essa base como ponto de partida do seu
-- progresso (privado). A correção comunitária + selo `verified` fica pra depois —
-- aqui é só a semente compartilhada.

-- Base compartilhada das partes: [{id, name, status, chords?}] (status é só o
-- padrão inicial; o progresso real vive por-usuário em library_entries.sections).
alter table public.canonical_songs
  add column if not exists sections jsonb not null default '[]'::jsonb;

-- create_canonical_and_add: aceita _sections e semeia o canônico; a entry nasce
-- herdando as seções do canônico (novo: as da IA; existente: a base já curada).
create or replace function public.create_canonical_and_add(
  _title text, _artist text, _difficulty int,
  _techniques text[], _genre text,
  _best_version_label text, _best_version_url text,
  _best_lesson_label text, _best_lesson_url text,
  _notes text, _sections jsonb default '[]'::jsonb
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
      (title, artist, difficulty, techniques, genre,
       best_version_label, best_version_url, best_lesson_label, best_lesson_url,
       notes, sections, created_by)
    values (_title, _artist, _difficulty, coalesce(_techniques,'{}'), _genre,
       _best_version_label, _best_version_url, _best_lesson_label, _best_lesson_url,
       _notes, coalesce(_sections,'[]'::jsonb), _uid)
    on conflict (dedup_key) do update set updated_at = now()
    returning * into _song;
  end if;

  -- Entry nasce com as seções do canônico; se já existir, preserva o progresso.
  insert into public.library_entries (user_id, song_id, sections)
  values (_uid, _song.id, coalesce(_song.sections,'[]'::jsonb))
  on conflict (user_id, song_id) do update set updated_at = now()
  returning * into _entry;

  update public.canonical_songs c
    set contributor_count = (select count(distinct user_id)
                             from public.library_entries where song_id = _song.id)
    where c.id = _song.id;

  return _entry;
end;
$$;

-- add_existing_to_library: ao adicionar uma música já no catálogo, a entry herda
-- as seções do canônico (não sobrescreve se a entry já existir).
create or replace function public.add_existing_to_library(_song_id uuid)
returns public.library_entries
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _entry public.library_entries;
  _secs jsonb;
begin
  if _uid is null then raise exception 'not authenticated'; end if;

  select sections into _secs from public.canonical_songs where id = _song_id;

  insert into public.library_entries (user_id, song_id, sections)
  values (_uid, _song_id, coalesce(_secs,'[]'::jsonb))
  on conflict (user_id, song_id) do update set updated_at = now()
  returning * into _entry;

  update public.canonical_songs c
    set contributor_count = (select count(distinct user_id)
                             from public.library_entries where song_id = _song_id)
    where c.id = _song_id;

  return _entry;
end;
$$;

grant execute on function public.create_canonical_and_add(
  text, text, int, text[], text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.add_existing_to_library(uuid) to authenticated;
