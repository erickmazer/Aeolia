# Biblioteca do Violonista — setup (login + banco)

Guia vivo de estudos de violão, **multiusuário**: cada pessoa faz login (por
e-mail/magic link, ou Google) e tem sua própria biblioteca; a página pública
`/violao` mostra a biblioteca de **vitrine** (a sua) só para leitura.

- **Stack:** Next.js 16 + Supabase (Postgres + Auth + RLS) + Claude (Sonnet 5) para gerar fichas.
- **Rotas:** `/violao` (vitrine pública) · `/violao/minha` (sua biblioteca, autenticada).
- **Enquanto não configurado:** `/violao` mostra a semente curada (13 músicas) como fallback — nada quebra.

## Fluxo de dados

```
/violao        → mostra músicas de quem tem profiles.is_showcase = true (RLS permite leitura anônima)
/violao/minha  → login Google → sua biblioteca (RLS: você só vê/edita as suas)
adicionar      → POST /violao/api/generate (Claude preenche a ficha) → você revisa → insert no Supabase
```

## Setup (uma vez)

### 1. Criar o projeto Supabase
1. [supabase.com](https://supabase.com) → New project.
2. **SQL Editor** → cole e rode `supabase/migrations/0001_biblioteca.sql` (cria tabelas, RLS e triggers).
3. **Project Settings → API** → copie a `URL` e a `anon public key`.

### 2. Login (e-mail por padrão — zero config)
O login por **e-mail (magic link)** já vem ligado no Supabase — não precisa
configurar provider nenhum. Só ajuste as URLs de redirecionamento:

1. **Authentication → URL Configuration → Redirect URLs**: adicione
   `https://erickmazer.com/auth/callback` e `http://localhost:7777/auth/callback`.
2. (Se o link do e-mail não logar) **Authentication → Email Templates → Magic Link**:
   aponte o link para `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
   O callback já trata esse formato.

**Google (opcional, pra depois):** crie um OAuth 2.0 Client ID no Google Cloud
(redirect URI `https://<seu-projeto>.supabase.co/auth/v1/callback`), cole Client
ID/Secret em **Authentication → Providers → Google**. O botão "entrar com Google"
já está na tela; passa a funcionar quando o provider estiver ligado.

### 3. Variáveis de ambiente
Copie `.env.example` → `.env.local` (dev) e preencha; configure as mesmas na **Vercel**:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (e opcionalmente `VIOLAO_FICHE_MODEL`)

### 4. Marcar sua conta como vitrine + semear
1. Rode o app, acesse `/violao/minha`, faça login com Google uma vez (cria seu profile).
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
- A `ANTHROPIC_API_KEY` fica só no servidor; a rota `/violao/api/generate` exige login.
- **Nunca** exponha a `SUPABASE_SERVICE_ROLE_KEY` no cliente nem na Vercel — ela ignora RLS.

## Gerador de ficha por linha de comando

Independente do site, dá pra gerar uma ficha no terminal:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
```
