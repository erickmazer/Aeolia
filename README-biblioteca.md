# Biblioteca (Aeolia) — setup (login + banco)

Guia vivo de estudos de música — **multiusuário** e começando com violão. Cada
pessoa faz login com **Google** e tem sua própria biblioteca;
a página pública `/musician/[username]` (hoje `/musician/erick`) mostra a
biblioteca de **vitrine** só para leitura.

- **Stack:** Next.js 16 + Supabase (Postgres + Auth + RLS) + Claude (Sonnet 5) para gerar fichas.
- **Rotas:** `/musician/[username]` (página pública do músico) · `/studio` (sua biblioteca, autenticada).
- **Enquanto não configurado:** `/musician/erick` mostra a semente curada (13 músicas) como fallback — nada quebra.

## Modelo de dados

Duas tabelas (migração `0002`):
- **`canonical_songs`** — dados objetivos da música, **compartilhados** e deduplicados
  (por `dedup_key` = título+artista sem acento). Melhora com o tempo (`contributor_count`, `verified`).
- **`library_entries`** — a relação de cada usuário com a música: `status`, nota pessoal e a
  **árvore pessoal** (`prerequisite_song_ids`/`next_song_ids`). A antiga `songs` fica como legado.

## Fluxo de dados

```
/musician/[username] → músicas de quem tem profiles.is_showcase = true (join library_entries → canonical_songs)
/studio              → login → sua biblioteca (RLS: você só vê/edita as suas entradas)
adicionar            → POST /api/generate: música JÁ no catálogo → devolve a ficha (sem IA);
                       música nova → Claude gera o rascunho → você revisa
salvar               → RPC no cliente (create_canonical_and_add / add_existing_to_library):
                       cria/reaproveita a canônica e adiciona a sua library_entry
```

As escritas na tabela canônica passam por **funções SECURITY DEFINER** (o usuário logado chama a
RPC, que valida `auth.uid()`). A `SUPABASE_SERVICE_ROLE_KEY` é usada **só** no seed local — nunca na Vercel.

## Setup (uma vez)

### 1. Criar o projeto Supabase
1. [supabase.com](https://supabase.com) → New project.
2. **SQL Editor** → rode `supabase/migrations/0001_biblioteca.sql` e depois `0002_canonical.sql` (tabelas, RLS, triggers, RPCs e backfill).
3. **Project Settings → API** → copie a `URL` e a `anon public key`.

### 2. Login com Google
O login é via **Google** (OAuth pelo Supabase). Configure uma vez:

1. **Google Cloud** → crie um OAuth 2.0 Client ID (redirect URI
   `https://<seu-projeto>.supabase.co/auth/v1/callback`).
2. **Supabase → Authentication → Providers → Google**: cole Client ID/Secret e habilite.
3. **Supabase → Authentication → URL Configuration → Redirect URLs**: adicione
   `https://erickmazer.com/auth/callback`, `http://localhost:7777/auth/callback` e o
   domínio de preview da Vercel (`https://<preview>.vercel.app/auth/callback`).

O botão **"Entrar com Google"** aparece no login do app; passa a funcionar assim que o
provider estiver habilitado. (O callback `/auth/callback` já troca o `code` por sessão.)

### 3. Variáveis de ambiente
Copie `.env.example` → `.env.local` (dev) e preencha; configure as mesmas na **Vercel**:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (e opcionalmente `FICHE_MODEL`)

### 4. Marcar sua conta como vitrine + semear
1. Rode o app, acesse `/studio`, faça login com Google uma vez (cria seu profile).
2. Pegue seu `user id` em Supabase → Authentication → Users.
3. Semeie a vitrine com as 13 músicas curadas (usa a service-role key, **só local**):
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Project Settings → API → service_role
   export SHOWCASE_USER_ID=<seu-user-uuid>
   bun run scripts/seed-showcase.ts
   ```
   Isso também marca seu profile como `is_showcase = true`.

## Segurança

- A página é pública, mas **RLS** garante que cada usuário só lê/escreve as suas músicas;
  a leitura pública é limitada às músicas da conta de vitrine.
- A `ANTHROPIC_API_KEY` fica só no servidor; a rota `/api/generate` exige login.
- **Nunca** exponha a `SUPABASE_SERVICE_ROLE_KEY` no cliente nem na Vercel — ela ignora RLS.

## Gerador de ficha por linha de comando

Independente do site, dá pra gerar uma ficha no terminal:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
```
