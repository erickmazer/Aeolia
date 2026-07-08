-- Conciliação item 1: desatar `contexts` em eixos limpos + camada privada eff().
-- ============================================================================
-- Hoje canonical_songs.contexts mistura gênero (mpb, folk-indie, pop-rock),
-- propósito/coleção (para-filha, relaxar, cantar-junto, estudar-tecnica) e nível
-- (bosses). Separa em:
--   • genre       → canônico (público), single, em canonical_songs.
--   • collections → privado por usuário (labels livres), em library_entries.
--   • priority    → privado (agora|proxima|algumdia), em library_entries.
-- E adiciona a camada privada do protótipo: stage, overrides (eff()), aula.
-- Mantém a coluna `contexts` (deprecada) por segurança; um 0005 pode dropá-la.
-- Rode UMA vez no SQL Editor do Supabase.

-- ── canonical_songs: genre (público) ────────────────────────────────────────
alter table public.canonical_songs add column if not exists genre text;

-- ── library_entries: camada privada ────────────────────────────────────────
alter table public.library_entries add column if not exists collections text[] not null default '{}';
alter table public.library_entries add column if not exists priority text
  check (priority is null or priority in ('agora','proxima','algumdia'));
alter table public.library_entries add column if not exists stage text not null default 'biblioteca'
  check (stage in ('backlog','biblioteca','arquivada'));
alter table public.library_entries add column if not exists overrides jsonb not null default '{}'::jsonb;
alter table public.library_entries add column if not exists aula text;

-- ── profiles: vocabulário de coleções do usuário ───────────────────────────
alter table public.profiles add column if not exists collections text[] not null default '{}';

-- ── Backfill: genre a partir dos contexts atuais (best-effort) ──────────────
update public.canonical_songs set genre = 'MPB'  where genre is null and 'mpb'        = any(contexts);
update public.canonical_songs set genre = 'Folk' where genre is null and 'folk-indie' = any(contexts);
update public.canonical_songs set genre = 'Rock' where genre is null and 'pop-rock'   = any(contexts);

-- ── Backfill: coleções pessoais a partir dos contexts (por usuário) ─────────
-- Cada library_entry herda as coleções derivadas dos contexts da sua canônica.
update public.library_entries le set collections = sub.cols
from (
  select le2.id,
         array_remove(array[
           case when 'para-filha'      = any(c.contexts) then 'Aurora'          end,
           case when 'relaxar'         = any(c.contexts) then 'Relaxar'         end,
           case when 'cantar-junto'    = any(c.contexts) then 'Cantar junto'    end,
           case when 'estudar-tecnica' = any(c.contexts) then 'Estudar técnica' end,
           case when 'bosses'          = any(c.contexts) then 'Desafios'        end
         ], null) as cols
  from public.library_entries le2
  join public.canonical_songs c on c.id = le2.song_id
) sub
where sub.id = le.id and array_length(sub.cols, 1) is not null;

-- vocabulário de coleções do usuário = união das coleções que ele usa
update public.profiles p set collections = sub.cols
from (
  select user_id, array_agg(distinct col) as cols
  from public.library_entries, lateral unnest(collections) col
  group by user_id
) sub
where sub.user_id = p.id;

-- ── RPC create_canonical_and_add: contexts → genre ─────────────────────────
create or replace function public.create_canonical_and_add(
  _title text, _artist text, _difficulty int,
  _techniques text[], _genre text,
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
      (title, artist, difficulty, techniques, genre,
       best_version_label, best_version_url, best_lesson_label, best_lesson_url,
       notes, created_by)
    values (_title, _artist, _difficulty, coalesce(_techniques,'{}'), _genre,
       _best_version_label, _best_version_url, _best_lesson_label, _best_lesson_url,
       _notes, _uid)
    on conflict (dedup_key) do update set updated_at = now()
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

grant execute on function public.create_canonical_and_add(
  text, text, int, text[], text, text, text, text, text, text) to authenticated;

-- (find_canonical e add_existing_to_library seguem iguais.)
