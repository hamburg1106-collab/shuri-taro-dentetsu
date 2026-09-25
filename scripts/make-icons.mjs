// アプリのアイコン（海の青に、赤い蒸気機関車）を作る。使い方: npm run icons
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2366c8"/>
  <g stroke="#5b93e0" stroke-width="10" fill="none" stroke-linecap="round">
    <path d="M40 90 q30 -24 60 0"/><path d="M380 70 q30 -24 60 0"/><path d="M60 450 q30 -24 60 0"/><path d="M390 440 q30 -24 60 0"/>
  </g>
  <rect x="40" y="330" width="432" height="26" rx="13" fill="#1e2230"/>
  <rect x="40" y="336" width="432" height="12" rx="6" fill="#fff"/>
  <g transform="translate(86 120) scale(7.6)">
    <rect x="18" y="0" width="7" height="10" fill="#1e2230"/>
    <rect x="15" y="0" width="13" height="4" rx="1" fill="#1e2230"/>
    <rect x="4" y="10" width="26" height="16" rx="7" fill="#e8423a" stroke="#1e2230" stroke-width="2.5"/>
    <rect x="28" y="4" width="15" height="22" rx="2" fill="#1b2a6b" stroke="#1e2230" stroke-width="2.5"/>
    <rect x="32" y="8" width="7" height="6" rx="1" fill="#ffd23f"/>
    <circle cx="7" cy="18" r="3" fill="#ffd23f" stroke="#1e2230" stroke-width="1.5"/>
    <circle cx="13" cy="31" r="5" fill="#1e2230"/>
    <circle cx="26" cy="31" r="5" fill="#1e2230"/>
    <circle cx="37" cy="31" r="5" fill="#1e2230"/>
  </g>
</svg>`

await writeFile(join(pub, 'favicon.svg'), svg)
const buf = Buffer.from(svg)
await sharp(buf).resize(192, 192).png().toFile(join(pub, 'icon-192.png'))
await sharp(buf).resize(512, 512).png().toFile(join(pub, 'icon-512.png'))
await sharp(buf).resize(180, 180).png().toFile(join(pub, 'apple-touch-icon.png'))
console.log('icons done')
