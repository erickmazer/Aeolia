# Scripts

Suporte à a biblioteca (`../lib/library`). Setup completo (Supabase +
login + banco) em [`../README-biblioteca.md`](../README-biblioteca.md).

## `generate-fiche.ts` — Gerador de ficha por IA (linha de comando)

Passa **título + artista**; o Claude devolve a ficha no mesmo schema da
biblioteca (compartilha prompt/schema com a rota do site via `lib/library/fiche-ai.ts`).
Reaproveita os IDs válidos de técnicas/contextos, então é impossível gerar uma
ficha malformada.

```bash
export ANTHROPIC_API_KEY=<sua-chave-z.ai>   # ou de outro endpoint compatível
bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
# FICHE_MODEL=glm-4.5-air (default, barato). Troque pelo modelo que quiser testar.
```

Usa **z.ai/GLM** (`glm-4.5-air`) por padrão — formato da API Anthropic, endpoint mais
barato. Para voltar à Anthropic: `ANTHROPIC_BASE_URL=https://api.anthropic.com` + um modelo `claude-*`.

## `seed-showcase.ts` — Semeia a vitrine

Insere as 13 músicas curadas (`../lib/library/seed-songs.ts`) na sua conta e
marca seu profile como vitrine pública. Usa a service-role key (só local). Veja
o passo a passo em [`../README-biblioteca.md`](../README-biblioteca.md) §4.
