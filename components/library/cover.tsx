import { artworkHiRes } from '@/lib/library/artwork'

// Capa do álbum (canônica). Cai num placeholder ♪ quando a música não tem capa
// (adicionada manualmente, ou antes de termos a arte). Reusada na lista, na
// ficha e na página da música.
export function Cover({
  artwork,
  size,
  className,
  rounded = 'rounded-md',
}: {
  artwork?: string
  size: number
  className?: string
  rounded?: string
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${rounded} ${className ?? ''}`}
      style={{ width: size, height: size, background: 'color-mix(in oklch, var(--color-paper) 8%, transparent)' }}
    >
      {artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artworkHiRes(artwork, Math.min(600, size * 2))} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[color:var(--color-ash)]"
          style={{ fontSize: size * 0.42 }}
          aria-hidden
        >
          ♪
        </div>
      )}
    </div>
  )
}
