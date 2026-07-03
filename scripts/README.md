# Scripts

Suporte à [Biblioteca Musical](../app/biblioteca). Setup completo (Supabase +
login + banco) em [`../README-biblioteca.md`](../README-biblioteca.md).

## `generate-fiche.ts` — Gerador de ficha por IA (linha de comando)

Passa **título + artista**; o Claude devolve a ficha no mesmo schema da
biblioteca (compartilha prompt/schema com a rota do site via `_lib/fiche-ai.ts`).
Reaproveita os IDs válidos de técnicas/contextos, então é impossível gerar uma
ficha malformada.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
bun run scripts/generate-fiche.ts "Blackbird" "The Beatles"
# FICHE_MODEL=claude-haiku-4-5 → custo mínimo; claude-opus-4-8 → qualidade máxima
```

Usa **Sonnet 5** por padrão (~0,7 centavo por ficha).

## `seed-showcase.ts` — Semeia a vitrine

Insere as 13 músicas curadas (`../app/biblioteca/_lib/seed-songs.ts`) na sua conta e
marca seu profile como vitrine pública. Usa a service-role key (só local). Veja
o passo a passo em [`../README-biblioteca.md`](../README-biblioteca.md) §4.
