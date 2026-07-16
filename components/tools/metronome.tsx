'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Metrônomo preciso via Web Audio API. Usa o padrão "lookahead scheduler"
// (Chris Wilson, "A Tale of Two Clocks"): um setInterval grosseiro (~25ms) que
// agenda os cliques dos próximos ~100ms diretamente no relógio do AudioContext,
// que é preciso. A UI (beat aceso) é dirigida por um rAF que compara o
// currentTime com uma fila de eventos já agendados.

const MIN_BPM = 40
const MAX_BPM = 240
const LOOKAHEAD_MS = 25 // de quanto em quanto o scheduler roda
const SCHEDULE_AHEAD = 0.1 // quantos segundos à frente agendar

export function Metronome({ compact = false }: { compact?: boolean } = {}) {
  const [bpm, setBpm] = useState(90)
  const [beatsPerBar, setBeatsPerBar] = useState(4)
  const [playing, setPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)

  // Refs — lidos dentro do scheduler (fora do ciclo de render do React).
  const ctxRef = useRef<AudioContext | null>(null)
  const bpmRef = useRef(bpm)
  const beatsPerBarRef = useRef(beatsPerBar)
  const nextNoteTimeRef = useRef(0)
  const beatInBarRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef = useRef<number | null>(null)
  const queueRef = useRef<{ beat: number; time: number }[]>([])
  const tapsRef = useRef<number[]>([])

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])
  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar
  }, [beatsPerBar])

  // Um clique curto: acento no primeiro tempo (mais agudo e forte).
  const click = useCallback((time: number, accent: boolean) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1600 : 1000
    const peak = accent ? 0.5 : 0.32
    gain.gain.setValueAtTime(peak, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.03)
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
    queueRef.current = []
    void ctxRef.current?.suspend()
    setPlaying(false)
    setCurrentBeat(-1)
  }, [])

  const start = useCallback(() => {
    let ctx = ctxRef.current
    if (!ctx) {
      ctx = new AudioContext()
      ctxRef.current = ctx
    }
    void ctx.resume()

    beatInBarRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.06

    const scheduler = () => {
      const c = ctxRef.current
      if (!c) return
      const secondsPerBeat = 60 / bpmRef.current
      while (nextNoteTimeRef.current < c.currentTime + SCHEDULE_AHEAD) {
        const beat = beatInBarRef.current
        click(nextNoteTimeRef.current, beat === 0)
        queueRef.current.push({ beat, time: nextNoteTimeRef.current })
        nextNoteTimeRef.current += secondsPerBeat
        beatInBarRef.current = (beat + 1) % beatsPerBarRef.current
      }
    }

    const draw = () => {
      const c = ctxRef.current
      if (c) {
        const q = queueRef.current
        while (q.length && q[0].time <= c.currentTime) {
          setCurrentBeat(q.shift()!.beat)
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    scheduler()
    timerRef.current = setInterval(scheduler, LOOKAHEAD_MS)
    rafRef.current = requestAnimationFrame(draw)
    setPlaying(true)
  }, [click])

  // Para tudo e libera o áudio ao desmontar (ex.: fechar a folha de ferramentas).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      void ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [])

  const nudge = (delta: number) => setBpm((b) => Math.min(MAX_BPM, Math.max(MIN_BPM, b + delta)))

  const tap = () => {
    const now = Date.now()
    const taps = tapsRef.current.filter((t) => now - t < 2000)
    taps.push(now)
    tapsRef.current = taps
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const next = Math.round(60000 / avg)
      setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, next)))
    }
  }

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-3' : 'gap-7 py-2'}`}>
      {/* Beats do compasso — o aceso segue o clique real */}
      <div className="flex items-center gap-2.5" aria-hidden>
        {Array.from({ length: beatsPerBar }).map((_, i) => {
          const on = playing && currentBeat === i
          const accent = i === 0
          return (
            <span
              key={i}
              className="h-3 w-3 rounded-full transition-all duration-75"
              style={{
                background: on
                  ? 'var(--color-patina)'
                  : 'color-mix(in oklch, var(--color-ash) 30%, transparent)',
                transform: on ? 'scale(1.5)' : 'scale(1)',
                outline: accent ? '1px solid color-mix(in oklch, var(--color-patina) 55%, transparent)' : 'none',
                outlineOffset: '3px',
              }}
            />
          )
        })}
      </div>

      {/* BPM */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`font-serif tabular-nums leading-none text-[color:var(--color-paper)] ${compact ? 'text-4xl' : 'text-6xl'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {bpm}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-ash)]">bpm</span>
      </div>

      {/* −  slider  + */}
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Diminuir BPM"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[color:var(--color-paper)]"
          style={{ background: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
        >
          −
        </button>
        <input
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          aria-label="BPM"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full"
          style={{ accentColor: 'var(--color-patina)', background: 'color-mix(in oklch, var(--color-ash) 30%, transparent)' }}
        />
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Aumentar BPM"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[color:var(--color-paper)]"
          style={{ background: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
        >
          +
        </button>
      </div>

      {/* Play/Pause + Tap */}
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={playing ? stop : start}
          className="flex-1 rounded-lg py-3 text-sm font-medium text-[color:var(--color-ink)] transition-opacity active:opacity-80"
          style={{ background: 'var(--color-patina)' }}
        >
          {playing ? 'parar' : 'iniciar'}
        </button>
        <button
          type="button"
          onClick={tap}
          className="rounded-lg px-5 py-3 text-sm text-[color:var(--color-paper)] transition-opacity active:opacity-80"
          style={{ background: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
        >
          tap
        </button>
      </div>

      {/* Tempos por compasso — escondido no modo compacto (fica no ToolsSheet) */}
      {!compact && (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[color:var(--color-ash)]">compasso</span>
        {[2, 3, 4, 5, 6, 7].map((n) => {
          const sel = beatsPerBar === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => setBeatsPerBar(n)}
              aria-pressed={sel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors"
              style={{
                background: sel ? 'var(--color-moss)' : 'color-mix(in oklch, var(--color-ash) 16%, transparent)',
                color: sel ? 'var(--color-ink)' : 'var(--color-paper)',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      )}
    </div>
  )
}
