'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Material, MaterialKind } from '@/lib/library/data'

const inputClass =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm text-[color:var(--color-paper)] placeholder:text-[color:var(--color-ash)] outline-none'
const borderStyle = { borderColor: 'color-mix(in oklch, var(--color-ash) 25%, transparent)' } as const
const cardBorder = { borderColor: 'color-mix(in oklch, var(--color-ash) 22%, transparent)' } as const

export interface SongRef {
  entryId: string
  title: string
  artist: string
}

// Glifo por tipo/mime — leve, combina com o uso de emoji já existente no app.
function glyph(m: Material): string {
  if (m.kind === 'link') return '🔗'
  const mime = m.mime ?? ''
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('audio/')) return '🎧'
  if (mime === 'application/pdf') return '📄'
  return '📎'
}

type Filter = 'all' | 'song' | 'loose'

export function MaterialsView({
  initialMaterials,
  songs,
}: {
  initialMaterials: Material[]
  songs: SongRef[]
}) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  // form
  const [kind, setKind] = useState<MaterialKind>('link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [entryId, setEntryId] = useState('')
  const [source, setSource] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const songTitle = useMemo(() => {
    const m: Record<string, string> = {}
    for (const s of songs) m[s.entryId] = `${s.title} — ${s.artist}`
    return m
  }, [songs])

  const shown = materials.filter((m) =>
    filter === 'all' ? true : filter === 'song' ? !!m.entryId : !m.entryId,
  )

  function reset() {
    setKind('link')
    setTitle('')
    setUrl('')
    setFile(null)
    setNote('')
    setEntryId('')
    setSource('')
    setError('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    const t = title.trim()
    if (!t) return setError('Dê um título ao material.')
    if (kind === 'link' && !url.trim()) return setError('Cole a URL do link.')
    if (kind === 'file' && !file) return setError('Escolha um arquivo.')

    setBusy(true)
    setError('')
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Faça login novamente.')

      const row: Record<string, unknown> = {
        user_id: user.id,
        title: t,
        kind,
        note: note.trim() || null,
        entry_id: entryId || null,
        source: source.trim() || null,
      }

      let openUrl: string | undefined
      let storagePath: string | undefined
      let mime: string | undefined

      if (kind === 'link') {
        row.url = url.trim()
        openUrl = url.trim()
      } else if (file) {
        const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80)
        const path = `${user.id}/${crypto.randomUUID()}-${safe}`
        const up = await supabase.storage.from('materials').upload(path, file, { upsert: false })
        if (up.error) throw up.error
        row.storage_path = path
        row.mime = file.type || null
        storagePath = path
        mime = file.type || undefined
        const signed = await supabase.storage.from('materials').createSignedUrl(path, 3600)
        openUrl = signed.data?.signedUrl
      }

      const ins = await supabase
        .from('materials')
        .insert(row)
        .select('id, created_at')
        .single()
      if (ins.error) throw ins.error

      const created: Material = {
        id: (ins.data as { id: string }).id,
        title: t,
        kind,
        entryId: entryId || undefined,
        note: note.trim() || undefined,
        mime,
        source: source.trim() || undefined,
        createdAt: (ins.data as { created_at: string }).created_at,
        openUrl,
        storagePath,
      }
      setMaterials((cur) => [created, ...cur])
      reset()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não deu pra salvar o material.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(m: Material) {
    if (!confirm(`Remover "${m.title}"?`)) return
    setMaterials((cur) => cur.filter((x) => x.id !== m.id))
    const supabase = createClient()
    await supabase.from('materials').delete().eq('id', m.id)
    if (m.kind === 'file' && m.storagePath) {
      await supabase.storage.from('materials').remove([m.storagePath])
    }
  }

  return (
    <div className="pt-2">
      <h1 className="mb-1 font-serif text-2xl text-[color:var(--color-paper)]">Materials</h1>
      <p className="mb-6 text-sm text-[color:var(--color-ash)]">
        Guarde o que o professor te passou — links e arquivos — soltos ou atrelados a uma música.
      </p>

      {/* adicionar */}
      {open ? (
        <form
          onSubmit={save}
          className="mb-6 rounded-xl border p-4"
          style={cardBorder}
        >
          <div className="mb-3 flex gap-2">
            {(['link', 'file'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="rounded-full px-3 py-1 text-sm transition-colors"
                style={
                  kind === k
                    ? { background: 'var(--color-patina)', color: 'var(--color-ink)' }
                    : { border: '1px solid color-mix(in oklch, var(--color-ash) 25%, transparent)', color: 'var(--color-ash)' }
                }
              >
                {k === 'link' ? '🔗 Link' : '📎 Arquivo'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input
              className={inputClass}
              style={borderStyle}
              placeholder="Título (ex.: Estudo de arpejo — aula 3)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {kind === 'link' ? (
              <input
                className={inputClass}
                style={borderStyle}
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            ) : (
              <input
                type="file"
                accept="application/pdf,image/*,audio/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-[color:var(--color-paper)] file:mr-3 file:rounded-md file:border-0 file:bg-[color:var(--color-patina)] file:px-3 file:py-2 file:text-sm file:text-[color:var(--color-ink)]"
              />
            )}
            <textarea
              className={inputClass}
              style={borderStyle}
              rows={2}
              placeholder="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <select
                className={inputClass + ' max-w-[60%]'}
                style={borderStyle}
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
              >
                <option value="">— sem música —</option>
                {songs.map((s) => (
                  <option key={s.entryId} value={s.entryId}>
                    {s.title} — {s.artist}
                  </option>
                ))}
              </select>
              <input
                className={inputClass + ' max-w-[36%]'}
                style={borderStyle}
                placeholder="fonte (ex.: Professor)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="mt-2 text-sm text-[color:oklch(0.65_0.15_25)]">{error}</p>}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)] disabled:opacity-40"
              style={{ background: 'var(--color-moss)' }}
            >
              {busy ? 'salvando…' : 'salvar'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              className="text-sm text-[color:var(--color-ash)] hover:text-[color:var(--color-paper)]"
            >
              cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-6 rounded-md px-4 py-2 text-sm text-[color:var(--color-ink)]"
          style={{ background: 'var(--color-patina)' }}
        >
          ＋ adicionar material
        </button>
      )}

      {/* filtro */}
      {materials.length > 0 && (
        <div className="mb-4 flex gap-2 text-xs">
          {(
            [
              ['all', 'todos'],
              ['song', 'por música'],
              ['loose', 'soltos'],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1 transition-colors"
              style={
                filter === f
                  ? { background: 'var(--color-patina)', color: 'var(--color-ink)' }
                  : { color: 'var(--color-ash)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* lista */}
      {shown.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[color:var(--color-ash)]">
          {materials.length === 0 ? 'Nenhum material ainda.' : 'Nada neste filtro.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.id} className="rounded-xl border p-4" style={cardBorder}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span aria-hidden>{glyph(m)}</span>
                    <span className="truncate font-serif text-lg text-[color:var(--color-paper)]">{m.title}</span>
                  </div>
                  {m.note && <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-paper)]/80">{m.note}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-ash)]">
                    {m.entryId && songTitle[m.entryId] && (
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{ background: 'color-mix(in oklch, var(--color-moss) 18%, transparent)' }}
                      >
                        {songTitle[m.entryId]}
                      </span>
                    )}
                    {m.source && <span>{m.source}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {m.openUrl && (
                    <a
                      href={m.openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md px-3 py-1.5 text-sm text-[color:var(--color-ink)]"
                      style={{ background: 'var(--color-patina)' }}
                    >
                      {m.kind === 'link' ? 'abrir' : 'ver'}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    className="text-xs text-[color:var(--color-ash)] hover:text-[color:oklch(0.65_0.15_25)]"
                  >
                    remover
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
