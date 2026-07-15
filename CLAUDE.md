# Aeolia — notas pro Claude Code

Plataforma pra músicos organizarem repertório, técnicas e evolução dos estudos.
Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase. Gerenciador: **bun**.

## Comandos
- `bun run dev` — dev server (porta 7777)
- `bun run build` — build de produção (roda type-check; use pra validar)
- `bun run lint` — eslint
- `bun install` — dependências (o ambiente começa sem `node_modules`)

## Convenções de trabalho

- **Sempre que uma tarefa exigir um passo manual que eu (Claude) não consigo
  executar daqui** — aplicar migration no Supabase, mexer em config de
  dashboard (Vercel, Supabase, DNS), rodar algo num painel externo, etc. —
  **já forneça, junto, um texto pronto pra colar no "Claude in Chrome"** que
  execute o passo. O texto deve ser autossuficiente: onde navegar, o que
  clicar, o conteúdo exato a colar, e o que confirmar no final. Não deixe o
  passo manual só descrito em prosa.

## Banco / migrations
- Migrations em `supabase/migrations/NNNN_nome.sql` (ordem numérica).
- **Não há CI de banco**: as migrations são aplicadas à mão no Supabase
  (SQL Editor ou `supabase db push`). Toda migration deve ser idempotente
  (`if not exists`, `create or replace`, `on conflict do nothing`).
- Escrita no catálogo canônico passa por RPCs `security definer`
  (`create_canonical_and_add`, `add_existing_to_library`, `find_canonical`) —
  o cliente nunca escreve direto em `canonical_songs`.
- Ao mudar a assinatura de uma RPC existente, **dropar a assinatura antiga**
  antes do `create or replace` (senão o Postgres cria uma sobrecarga).

## Estilo / UI
- Paleta earthen em OKLCH e tokens de spacing no `@theme` de `app/globals.css`;
  títulos na serifada da marca (`font-serif`), corpo em sem-serifa.
- Primitivos de movimento reutilizáveis em `globals.css` (`.skeleton`,
  `.aeolia-rise`) — respeitam `prefers-reduced-motion`.
- Rotas de API protegidas espelham o padrão de auth de `app/api/generate`
  (`supabase.auth.getUser()` → 401).
