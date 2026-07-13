'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'
import { hzToNote, type NoteReading } from '@/lib/tools/pitch'

// Afinador cromático. Fluxo: getUserMedia → AnalyserNode → pitchy (McLeod Pitch
// Method) → [Hz, clarity]. Só aceita leituras com clarity alta (gate de ruído,
// essencial captando violão) e dentro da faixa útil de um violão. O mapeamento
// Hz → nota + cents vem de lib/tools/pitch.ts.

type Status = 'idle' | 'requesting' | 'running' | 'denied' | 'error'

const CLARITY_MIN = 0.9
const MIN_HZ = 60 // abaixo disso é ruído/rumble
const MAX_HZ = 1200 // acima da faixa útil pro instrumento
const IN_TUNE_CENTS = 5

export function Tuner() {
  const [status, setStatus] = useState<Status>('idle')
  const [reading, setReading] = useState<NoteReading | null>(null)
  const [live, setLive] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
  }, [])

  const start = useCallback(async () => {
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser) // não conecta ao destino — evita realimentação

      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const input = new Float32Array(detector.inputLength)

      const update = () => {
        const c = ctxRef.current
        if (c) {
          analyser.getFloatTimeDomainData(input)
          const [pitch, clarity] = detector.findPitch(input, c.sampleRate)
          if (clarity >= CLARITY_MIN && pitch >= MIN_HZ && pitch <= MAX_HZ) {
            const note = hzToNote(pitch)
            if (note) {
              setReading(note)
              setLive(true)
            }
          } else {
            setLive(false)
          }
        }
        rafRef.current = requestAnimationFrame(update)
      }
      rafRef.current = requestAnimationFrame(update)
      setStatus('running')
    } catch (e) {
      stop()
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      setStatus(denied ? 'denied' : 'error')
    }
  }, [stop])

  useEffect(() => stop, [stop]) // encerra o microfone ao desmontar (fechar a folha)

  const cents = reading?.cents ?? 0
  const clamped = Math.max(-50, Math.min(50, cents))
  const inTune = live && Math.abs(cents) <= IN_TUNE_CENTS
  const accent = inTune ? 'var(--color-moss)' : 'var(--color-patina)'

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="max-w-[26ch] text-sm leading-relaxed text-[color:var(--color-ash)]">
            O afinador usa o microfone pra ouvir a corda. Toque uma nota por vez.
          </p>
          <button
            type="button"
            onClick={start}
            className="rounded-lg px-6 py-3 text-sm font-medium text-[color:var(--color-ink)] transition-opacity active:opacity-80"
            style={{ background: 'var(--color-patina)' }}
          >
            ligar microfone
          </button>
        </div>
      )}

      {status === 'requesting' && (
        <p className="py-10 text-sm text-[color:var(--color-ash)]">pedindo acesso ao microfone…</p>
      )}

      {status === 'denied' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="max-w-[30ch] text-sm leading-relaxed text-[color:var(--color-paper)]">
            Sem acesso ao microfone. Libere a permissão nas configurações do navegador e tente de novo.
          </p>
          <button
            type="button"
            onClick={start}
            className="rounded-lg px-5 py-2.5 text-sm text-[color:var(--color-paper)]"
            style={{ background: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' }}
          >
            tentar de novo
          </button>
        </div>
      )}

      {status === 'error' && (
        <p className="py-10 text-center text-sm text-[color:var(--color-paper)]">
          Não consegui iniciar o áudio. Tente recarregar a página.
        </p>
      )}

      {status === 'running' && (
        <>
          {/* Nota */}
          <div className="flex flex-col items-center gap-1" style={{ opacity: live ? 1 : 0.4, transition: 'opacity 120ms' }}>
            <span className="font-serif text-7xl leading-none text-[color:var(--color-paper)]">
              {reading ? reading.note.replace('#', '♯') : '—'}
            </span>
            <span className="text-sm tabular-nums text-[color:var(--color-ash)]">
              {reading ? `${reading.octave}` : ''}
            </span>
          </div>

          {/* Medidor de cents */}
          <div className="w-full">
            <div
              className="relative h-12 w-full rounded-lg"
              style={{ background: 'color-mix(in oklch, var(--color-ash) 14%, transparent)' }}
            >
              {/* centro (afinado) */}
              <div
                className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2"
                style={{ background: 'color-mix(in oklch, var(--color-ash) 45%, transparent)' }}
              />
              {/* ponteiro */}
              <div
                className="absolute top-1.5 bottom-1.5 w-1.5 rounded-full transition-all duration-100"
                style={{
                  left: `calc(${((clamped + 50) / 100) * 100}% - 3px)`,
                  background: accent,
                  boxShadow: inTune ? `0 0 12px ${accent}` : 'none',
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-[color:var(--color-ash)]">
              <span>♭ grave</span>
              <span style={{ color: inTune ? 'var(--color-moss)' : undefined }}>
                {live ? (inTune ? 'afinado' : `${cents > 0 ? '+' : ''}${cents}¢`) : 'ouvindo…'}
              </span>
              <span>agudo ♯</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
