-- Treino de exercícios por usuário (nível 0–3). O catálogo de exercícios mora
-- em código (lib/library/exercises.ts); aqui guardamos só o progresso pessoal.

create table if not exists public.user_exercises (
  user_id     uuid not null references auth.users on delete cascade,
  exercise_id text not null,
  level       int  not null default 1 check (level between 0 and 3),
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

drop trigger if exists user_exercises_touch_updated_at on public.user_exercises;
create trigger user_exercises_touch_updated_at
  before update on public.user_exercises
  for each row execute function public.touch_updated_at();

alter table public.user_exercises enable row level security;

drop policy if exists user_exercises_select_own on public.user_exercises;
create policy user_exercises_select_own on public.user_exercises
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_exercises_insert_own on public.user_exercises;
create policy user_exercises_insert_own on public.user_exercises
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists user_exercises_update_own on public.user_exercises;
create policy user_exercises_update_own on public.user_exercises
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists user_exercises_delete_own on public.user_exercises;
create policy user_exercises_delete_own on public.user_exercises
  for delete to authenticated using (auth.uid() = user_id);
