-- Log de prática (issue #7) — o registro leve do ato de praticar.
-- Append-only: cada toque em "pratiquei" é uma linha. Disso saem streak,
-- histórico por música e o melhor sinal de personalização (o que você
-- realmente pratica, não o que marcou).

create table if not exists public.practice_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  -- a entrada pessoal praticada (nullable: sobrevive à remoção da música).
  entry_id   uuid references public.library_entries on delete set null,
  -- snapshot do id canônico p/ agregação histórica mesmo sem a entry.
  song_id    text,
  -- parte específica praticada (id de section jsonb), opcional.
  section_id text,
  -- minutos praticados, opcional (1 toque não exige preencher).
  minutes    int check (minutes is null or (minutes >= 0 and minutes <= 1440)),
  note       text,
  logged_at  timestamptz not null default now(),
  -- dia local do usuário (YYYY-MM-DD), gravado pelo cliente que conhece o fuso.
  -- É a base do streak: dias consecutivos com ao menos um registro. Sem depender
  -- de o servidor adivinhar o timezone. Default = data UTC como fallback.
  local_day  date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

-- Histórico do usuário por recência (streak, "hoje/semana", por música).
create index if not exists practice_logs_user_time
  on public.practice_logs (user_id, logged_at desc);
create index if not exists practice_logs_entry
  on public.practice_logs (entry_id);

alter table public.practice_logs enable row level security;

drop policy if exists practice_logs_select_own on public.practice_logs;
create policy practice_logs_select_own on public.practice_logs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists practice_logs_insert_own on public.practice_logs;
create policy practice_logs_insert_own on public.practice_logs
  for insert to authenticated with check (auth.uid() = user_id);

-- Correções/apagar um registro errado; sem update (log é append-only).
drop policy if exists practice_logs_delete_own on public.practice_logs;
create policy practice_logs_delete_own on public.practice_logs
  for delete to authenticated using (auth.uid() = user_id);
