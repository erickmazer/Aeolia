// build-brand.mjs — gera os assets de marca do Aeolia a partir da fonte Zodiak.
//
// Por quê: o ambiente do agente não alcança a Fontshare (proxy bloqueia), então
// os assets que dependem do binário da fonte são gerados aqui, na sua máquina.
//
// Passo 0: baixe a Zodiak em https://www.fontshare.com/fonts/zodiak e coloque em
//   assets/fonts/  →  Zodiak-Bold.ttf   (obrigatório — wordmark + ícone)
//                     Zodiak-Regular.ttf (recomendado — títulos no peso normal)
// Passo 1: na raiz do repo:
//   npm i -D opentype.js sharp wawoff2
//   node scripts/build-brand.mjs
// Passo 2: commite o que apareceu em public/fonts, public/icons, public/ e public/brand.
//
// O que gera:
//   public/fonts/zodiak-bold.woff2      (self-host, peso 700)
//   public/fonts/zodiak-regular.woff2   (self-host, peso 400) — se o Regular existir
//   public/favicon.svg + public/icon.svg (tile Æ)
//   public/icons/{favicon-32,apple-touch-icon,icon-192,icon-512,maskable-512}.png
//   public/brand/{aeolia-wordmark,aeolia-wordmark-lig}.svg (wordmarks vetorizados)

import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'
import sharp from 'sharp'
import { compress } from 'wawoff2'

const INK = '#1a1712' // ≈ --color-ink (oklch(0.15 0.01 80))
const PATINA = '#a88a63' // ≈ --color-patina (oklch(0.62 0.04 60))
const FONT_DIR = 'assets/fonts'

const mkdir = (d) => fs.mkdirSync(d, { recursive: true })
const find = (re) =>
  fs.existsSync(FONT_DIR) ? fs.readdirSync(FONT_DIR).find((f) => re.test(f)) : undefined

const boldFile = find(/bold/i)
if (!boldFile) {
  console.error(`✗ não achei um Zodiak Bold em ${FONT_DIR}/ (ex.: Zodiak-Bold.ttf). Veja o topo do script.`)
  process.exit(1)
}
const regularFile = find(/regular/i)

const boldPath = path.join(FONT_DIR, boldFile)
const font = await opentype.load(boldPath)

mkdir('public/fonts')
mkdir('public/icons')
mkdir('public/brand')

// --- woff2 auto-hospedados (self-host, sem dependência externa em runtime) ---
async function toWoff2(ttfPath, outName) {
  const woff2 = await compress(fs.readFileSync(ttfPath))
  fs.writeFileSync(path.join('public/fonts', outName), woff2)
  console.log(`  fonts/${outName}`)
}
await toWoff2(boldPath, 'zodiak-bold.woff2')
if (regularFile) await toWoff2(path.join(FONT_DIR, regularFile), 'zodiak-regular.woff2')
else console.warn('  ! sem Zodiak-Regular.ttf — títulos no peso normal caem em Georgia até você adicioná-lo')

// --- wordmarks vetorizados em PATH (independem da fonte carregar) ---
function wordmark(text) {
  const size = 140
  const p = font.getPath(text, 0, size, size)
  const b = p.getBoundingBox()
  const pad = 12
  const w = Math.ceil(b.x2 - b.x1) + pad * 2
  const h = Math.ceil(b.y2 - b.y1) + pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x1 - pad} ${b.y1 - pad} ${w} ${h}" role="img" aria-label="Aeolia"><path d="${p.toPathData(2)}" fill="currentColor"/></svg>\n`
}
fs.writeFileSync('public/brand/aeolia-wordmark.svg', wordmark('Aeolia'))
fs.writeFileSync('public/brand/aeolia-wordmark-lig.svg', wordmark('Æolia'))
console.log('  brand/aeolia-wordmark{,-lig}.svg')

// --- ícone: Æ centralizado num tile ---
function icon({ S = 512, pad = 0.16, round = true } = {}) {
  const g = font.getPath('Æ', 0, 0, 300)
  const b = g.getBoundingBox()
  const gw = b.x2 - b.x1
  const gh = b.y2 - b.y1
  const s = Math.min((S * (1 - 2 * pad)) / gw, (S * (1 - 2 * pad)) / gh)
  const tx = (S - gw * s) / 2 - b.x1 * s
  const ty = (S - gh * s) / 2 - b.y1 * s
  const rx = round ? Math.round(S * 0.222) : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="${rx}" fill="${INK}"/><g transform="translate(${tx} ${ty}) scale(${s})"><path d="${g.toPathData(2)}" fill="${PATINA}"/></g></svg>`
}
fs.writeFileSync('public/icon.svg', icon())
fs.writeFileSync('public/favicon.svg', icon({ pad: 0.12 }))
console.log('  icon.svg, favicon.svg')

// --- PNGs (o SVG é path-only → sharp rasteriza sem precisar da fonte) ---
const pngs = [
  [32, 'icons/favicon-32.png'],
  [180, 'icons/apple-touch-icon.png'],
  [192, 'icons/icon-192.png'],
  [512, 'icons/icon-512.png'],
]
for (const [px, name] of pngs) {
  await sharp(Buffer.from(icon())).resize(px, px).png().toFile(path.join('public', name))
  console.log(`  ${name}`)
}
// maskable: quadrado cheio + mais respiro (o SO aplica a máscara)
await sharp(Buffer.from(icon({ pad: 0.26, round: false }))).resize(512, 512).png().toFile('public/icons/maskable-512.png')
console.log('  icons/maskable-512.png')

console.log('\n✓ assets de marca gerados')
