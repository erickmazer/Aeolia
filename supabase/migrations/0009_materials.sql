-- Materiais (do professor e afins) — links e arquivos.
-- Entidade própria, por usuário, que vive independente e pode ser OPCIONALMENTE
-- atrelada a uma música (library_entry). Arquivos vão pro Supabase Storage
-- (bucket privado `materials`); links guardam só a URL.

create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  kind        text not null check (kind in ('link', 'file')),
  url         text,              -- kind = 'link'
  storage_path text,             -- kind = 'file' (path dentro do bucket `materials`)
  mime        text,
  note        text,
  -- vínculo opcional a uma música da biblioteca do usuário; sobrevive à remoção.
  entry_id    uuid references public.library_entries on delete set null,
  source      text,              -- ex.: "Professor"
  given_at    date,              -- quando o material foi passado (opcional)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- link exige url; file exige storage_path
  constraint materials_kind_target check (
    (kind = 'link' and url is not null) or (kind = 'file' and storage_path is not null)
  )
);

drop trigger if exists materials_touch_updated_at on public.materials;
create trigger materials_touch_updated_at
  before update on public.materials
  for each row execute function public.touch_updated_at();

create index if not exists materials_user_time on public.materials (user_id, created_at desc);
create index if not exists materials_entry on public.materials (entry_id);

alter table public.materials enable row level security;

-- Own-only: materiais são privados (não entram na vitrine pública).
drop policy if exists materials_select_own on public.materials;
create policy materials_select_own on public.materials
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own on public.materials
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists materials_update_own on public.materials;
create policy materials_update_own on public.materials
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists materials_delete_own on public.materials;
create policy materials_delete_own on public.materials
  for delete to authenticated using (auth.uid() = user_id);

-- ── Storage: bucket privado para os arquivos ────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materials', 'materials', false, 26214400,  -- 25 MiB
  array[
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/ogg'
  ]
)
on conflict (id) do nothing;

-- Acesso escopado à pasta do próprio usuário: path = `<user_id>/<uuid>-<nome>`.
drop policy if exists materials_objects_select_own on storage.objects;
create policy materials_objects_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists materials_objects_insert_own on storage.objects;
create policy materials_objects_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists materials_objects_delete_own on storage.objects;
create policy materials_objects_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);
