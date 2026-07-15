-- Capa do álbum no catálogo canônico (público).
-- ============================================================================
-- Quando a música é adicionada pelo autocomplete (iTunes Search API), já temos a
-- URL da capa. Persistir aqui deixa a biblioteca/ficha muito mais legíveis depois
-- (capa na lista e no herói da ficha). É só a URL — nada é re-hospedado.
-- Rode UMA vez no SQL Editor do Supabase (ou `supabase db push`). Idempotente.

alter table public.canonical_songs add column if not exists artwork text;

-- create_canonical_and_add: aceita _artwork e semeia o canônico com a capa.
-- Dropa a assinatura anterior (0010) pra não criar uma sobrecarga — o novo
-- parâmetro muda a assinatura e `create or replace` criaria uma 2ª função.
drop function if exists public.create_canonical_and_add(
  text, text, int, text[], text, text, text, text, text, text, jsonb);

create or replace function public.create_canonical_and_add(
  _title text, _artist text, _difficulty int,
  _techniques text[], _genre text,
  _best_version_label text, _best_version_url text,
  _best_lesson_label text, _best_lesson_url text,
  _notes text, _sections jsonb default '[]'::jsonb,
  _artwork text default null
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
       notes, sections, artwork, created_by)
    values (_title, _artist, _difficulty, coalesce(_techniques,'{}'), _genre,
       _best_version_label, _best_version_url, _best_lesson_label, _best_lesson_url,
       _notes, coalesce(_sections,'[]'::jsonb), _artwork, _uid)
    on conflict (dedup_key) do update set updated_at = now()
    returning * into _song;
  elsif _song.artwork is null and _artwork is not null then
    -- Backfill leve: se a canônica existe sem capa e agora temos uma, preenche.
    update public.canonical_songs set artwork = _artwork where id = _song.id
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

grant execute on function public.create_canonical_and_add(
  text, text, int, text[], text, text, text, text, text, text, jsonb, text) to authenticated;
