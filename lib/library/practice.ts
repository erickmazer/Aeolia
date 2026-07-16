// Log de prática (issue #7) — helpers isomórficos (sem IO, sem 'server-only').
// A leitura crua vem de queries.ts (server); o cálculo de streak/hoje/semana é
// puro e roda tanto no server quanto no client, sempre a partir do "dia local".

/** Uma linha de practice_logs, como devolvida pelo Supabase. */
export interface PracticeLogRow {
  id: string
  entry_id: string | null
  song_id: string | null
  section_id: string | null
  minutes: number | null
  note: string | null
  logged_at: string
  local_day: string // YYYY-MM-DD (dia local do usuário)
}

/** Agregado cru pra alimentar a UI (o cálculo temporal é feito no client). */
export interface PracticeSummary {
  /** dias locais distintos com prática, mais recente primeiro. */
  days: string[]
  totalSessions: number
  totalMinutes: number
  /** por entry_id: nº de sessões e último dia praticado. */
  byEntry: Record<string, { count: number; lastDay: string }>
  /** por dia local (YYYY-MM-DD): sessões e minutos — alimenta o heatmap. */
  byDay: Record<string, { count: number; minutes: number }>
}

export const EMPTY_SUMMARY: PracticeSummary = {
  days: [],
  totalSessions: 0,
  totalMinutes: 0,
  byEntry: {},
  byDay: {},
}

/** Dia local (YYYY-MM-DD) de uma data — usa o fuso do ambiente que chama. */
export function localDay(d: Date = new Date()): string {
  // en-CA formata como YYYY-MM-DD; sem timeZone usa o fuso local do runtime.
  return d.toLocaleDateString('en-CA')
}

/** Soma `delta` dias a um YYYY-MM-DD (sem drift de fuso: opera em UTC puro). */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) + delta * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

/**
 * Streak = dias consecutivos com prática terminando hoje (ou ontem, período de
 * graça: você ainda não praticou hoje mas o streak não quebrou). Também devolve
 * o maior streak histórico. `days` pode vir em qualquer ordem/duplicado.
 */
export function computeStreak(
  days: Iterable<string>,
  today: string = localDay(),
): { current: number; longest: number } {
  const set = new Set(days)
  if (set.size === 0) return { current: 0, longest: 0 }

  // Streak atual: ancora em hoje se praticou hoje, senão em ontem (graça).
  let anchor: string | null = null
  if (set.has(today)) anchor = today
  else if (set.has(addDays(today, -1))) anchor = addDays(today, -1)

  let current = 0
  if (anchor) {
    let cursor = anchor
    while (set.has(cursor)) {
      current++
      cursor = addDays(cursor, -1)
    }
  }

  // Maior streak histórico: varre os dias ordenados.
  const sorted = [...set].sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1
    if (run > longest) longest = run
    prev = day
  }

  return { current, longest }
}

/** Praticou hoje? */
export function practicedToday(days: Iterable<string>, today: string = localDay()): boolean {
  return new Set(days).has(today)
}

/** Nº de dias (dos últimos 7, incluindo hoje) com prática. */
export function daysThisWeek(days: Iterable<string>, today: string = localDay()): number {
  const set = new Set(days)
  let n = 0
  for (let i = 0; i < 7; i++) if (set.has(addDays(today, -i))) n++
  return n
}
