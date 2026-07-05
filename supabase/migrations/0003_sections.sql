-- Progresso dentro de uma música (por partes/seções) — issue #5.
-- Partes PESSOAIS por library_entry (coerente com a árvore pessoal).
-- Cada item: { id: text, name: text, status: 'a-fazer'|'praticando'|'dominada' }.
-- O app valida a forma; aqui é jsonb livre com default [].

alter table public.library_entries
  add column if not exists sections jsonb not null default '[]'::jsonb;
