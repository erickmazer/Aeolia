import { ImageResponse } from 'next/og'

// Imagem de preview (Open Graph / Twitter) — aparece ao compartilhar o link.
// Convenção do Next: registra automaticamente, sem editar o metadata do layout.
export const alt = 'Aeolia — sua jornada musical'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#1c1a17',
          padding: '80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ fontSize: 120, color: '#e9dfce', lineHeight: 1 }}>Aeolia</div>
        <div style={{ marginTop: 28, fontSize: 40, color: '#b79b74' }}>Sua jornada musical</div>
        <div style={{ marginTop: 12, fontSize: 26, color: '#9c8c76' }}>
          Repertório · técnicas · progresso — começando com violão
        </div>
      </div>
    ),
    { ...size },
  )
}
