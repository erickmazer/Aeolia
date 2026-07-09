-- Adoção da taxonomia de técnicas do protótipo (7 + fundamentos).
-- Remapeia as técnicas das músicas canônicas das 9 antigas para as novas.
--   independencia-mao-direita → independencia
--   voicings                  → harmonia
--   harmonicos, percussao, improvisacao, cantar-tocando → removidas
-- Best-effort: técnicas removidas não têm equivalente 1:1. Rode UMA vez.

update public.canonical_songs c set techniques = coalesce(sub.arr, '{}')
from (
  select id, array_remove(array_agg(
    case t
      when 'independencia-mao-direita' then 'independencia'
      when 'voicings' then 'harmonia'
      when 'harmonicos' then null
      when 'percussao' then null
      when 'improvisacao' then null
      when 'cantar-tocando' then null
      else t
    end order by 1), null) as arr
  from public.canonical_songs, lateral unnest(techniques) t
  group by id
) sub
where sub.id = c.id;
