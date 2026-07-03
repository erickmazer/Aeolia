# Aeolia — Biblioteca do Violonista

Um guia vivo de estudos de violão, **multiusuário**: cada pessoa faz login (por
e-mail/magic link, ou Google) e tem sua própria biblioteca; a página pública
`/violao` mostra a biblioteca de **vitrine** só para leitura.

- **Stack:** Next.js 16 + Tailwind CSS v4 + Supabase (Postgres + Auth + RLS) + Claude (Sonnet 5) para gerar fichas.
- **Rotas:** `/violao` (vitrine pública) · `/violao/minha` (biblioteca pessoal, autenticada).
- **Enquanto não configurado:** `/violao` mostra a semente curada (13 músicas) como fallback — nada quebra.

Este projeto foi migrado a partir de `erickmazer/personal-website` (`v1/app/violao`),
extraído como um app standalone.

## Desenvolvimento

```bash
bun install
bun run dev
```

Depois abra [http://localhost:7777](http://localhost:7777) (redireciona para `/violao`).

## Setup completo (login + banco + IA)

O passo a passo de Supabase, login e variáveis de ambiente está em
[`README-violao.md`](./README-violao.md). Resumo:

1. Criar projeto Supabase e rodar `supabase/migrations/0001_biblioteca.sql`.
2. Configurar login por e-mail (zero-config) e, opcionalmente, Google OAuth.
3. Definir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `ANTHROPIC_API_KEY` (veja `.env.example`).
4. Fazer login uma vez e rodar `bun run scripts/seed-showcase.ts` para semear a vitrine.
