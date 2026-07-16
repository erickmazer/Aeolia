-- Setter de capa pra backfill das músicas antigas sem arte.
-- ============================================================================
-- Preenche `canonical_songs.artwork` de uma música que ainda não tem capa, a
-- partir de uma URL (o backfill busca no iTunes e chama esta RPC).
-- `security definer` porque a RLS bloqueia escrita direta do cliente em
-- canonical_songs. Restrições de segurança embutidas na cláusula WHERE:
--   • fill-only: só atualiza quando `artwork is null` (nunca sobrescreve);
--   • só o dono (profiles.is_showcase) pode preencher.
-- Rode UMA vez no SQL Editor do Supabase. Idempotente.

create or replace function public.set_canonical_artwork(_song_id uuid, _artwork text)
returns void
language sql security definer
set search_path = public, pg_temp
as $$
  update public.canonical_songs
     set artwork = _artwork, updated_at = now()
   where id = _song_id
     and artwork is null
     and _artwork is not null
     and exists (
       select 1 from public.profiles p
       where p.id = auth.uid() and p.is_showcase = true
     );
$$;

grant execute on function public.set_canonical_artwork(uuid, text) to authenticated;
