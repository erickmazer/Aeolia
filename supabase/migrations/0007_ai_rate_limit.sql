-- Rate-limit das rotas de IA (custo/abuso). O catálogo de chamadas é logado
-- aqui; a checagem+log é atômica via RPC SECURITY DEFINER (usa auth.uid()).

create table if not exists public.ai_calls (
  id         bigserial primary key,
  user_id    uuid not null references auth.users on delete cascade,
  route      text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_calls_user_route_time_idx
  on public.ai_calls (user_id, route, created_at);

alter table public.ai_calls enable row level security;
-- sem políticas de cliente: escrita/leitura só via a RPC abaixo.

-- Retorna true e registra a chamada se o usuário está sob o limite; false se estourou.
create or replace function public.rate_limit_ai(_route text, _max int, _window_secs int)
returns boolean
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  _uid uuid := auth.uid();
  _count int;
begin
  if _uid is null then return false; end if;
  select count(*) into _count from public.ai_calls
    where user_id = _uid and route = _route
      and created_at > now() - make_interval(secs => _window_secs);
  if _count >= _max then return false; end if;
  insert into public.ai_calls (user_id, route) values (_uid, _route);
  return true;
end;
$$;

grant execute on function public.rate_limit_ai(text, int, int) to authenticated;
