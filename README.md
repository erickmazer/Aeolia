# Aeolia

Plataforma para músicos organizarem repertório, técnicas e a evolução dos seus
estudos — **multiusuário**, começando com **violão** e arquitetada para expandir
para outros instrumentos.

Cada pessoa faz login (por e-mail/magic link, ou Google) e tem sua própria
biblioteca. A página pública de cada músico vive em `/musician/[username]`; o
trabalho pessoal (adicionar/editar/remover, com fichas por IA) fica em `/studio`.

- **Stack:** Next.js 16 + Tailwind CSS v4 + Supabase (Postgres + Auth + RLS) + Claude (Sonnet 5) para gerar fichas.
- **Rotas:**
  - `/musician/[username]` — página pública do músico (vitrine, só leitura). Hoje `/musician/erick`.
  - `/studio` — biblioteca pessoal autenticada (adicionar/editar/remover).
  - `/api/generate` — geração de ficha por IA (protegida por login).
- **Enquanto o Supabase não está configurado:** a vitrine mostra a semente curada (13 músicas) como fallback — nada quebra.

> **Estado atual:** começa com violão (taxonomia de técnicas/contextos e semente
> são de repertório de violão). A rota `/musician/[username]` já é dinâmica —
> pronta para uma página pública por usuário — mas a resolução por username e a
> generalização das entidades (perfis, instrumentos) ficam para um próximo passo.

Migrado a partir de `erickmazer/personal-website` (`v1/app/violao`) e reestruturado
como um app standalone.

## Desenvolvimento

```bash
bun install
bun run dev
```

Depois abra [http://localhost:7777](http://localhost:7777) (redireciona para `/musician/erick`).

## Setup completo (login + banco + IA)

O passo a passo de Supabase, login e variáveis de ambiente está em
[`README-biblioteca.md`](./README-biblioteca.md). Resumo:

1. Criar projeto Supabase e rodar `supabase/migrations/0001_biblioteca.sql`.
2. Configurar login por e-mail (zero-config) e, opcionalmente, Google OAuth.
3. Definir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `ANTHROPIC_API_KEY` (veja `.env.example`).
4. Fazer login uma vez e rodar `bun run scripts/seed-showcase.ts` para semear a vitrine.
