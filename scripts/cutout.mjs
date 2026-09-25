// しゅりまるのイラストを、アプリ用の軽い画像（webp）にする。
//
// 元画像は作業スペースの inbox/shuri-taro/ にある（公開リポジトリには入れない）。
// - full（全身）: 外側の白い背景を透明にする。ご褒美マスで青い背景の上に出すため
// - point（指さし）: しゅりまるの周りだけを切り出す（隣の人を外す）。白枠の中に出すので透明化はしない
// - mic / family: 縮小だけ。白枠の中に出す
//
// 使い方: npm run cutout
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, '..', 'inbox', 'shuri-taro')
const out = join(root, 'public', 'img')
await mkdir(out, { recursive: true })

/** 外周から「白っぽい」画素をたどって透明にする（塗りつぶしの要領）。ステッカーの白フチは黒い線の内側なので残る */
const cutoutWhite = async (input, width) => {
  const { data, info } = await sharp(input).resize({ width }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isBg = (i) => {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    return Math.min(r, g, b) >= 200 && Math.max(r, g, b) - Math.min(r, g, b) <= 26
  }
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (seen[i] || !isBg(i)) continue
    seen[i] = 1
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }
  // 背景に残った影のかけらを消す：つながった塊のうち、一番大きいもの（本体）だけ残す
  const label = new Int32Array(w * h).fill(-1)
  let best = -1
  let bestSize = 0
  let n = 0
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || label[s] !== -1) continue
    let size = 0
    const q = [s]
    label[s] = n
    while (q.length) {
      const i = q.pop()
      size++
      const x = i % w
      const y = (i / w) | 0
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && !seen[j] && label[j] === -1) {
          label[j] = n
          q.push(j)
        }
      }
    }
    if (size > bestSize) {
      bestSize = size
      best = n
    }
    n++
  }
  for (let i = 0; i < w * h; i++) if (label[i] !== best) seen[i] = 1
  for (let i = 0; i < w * h; i++) if (seen[i]) data[i * 4 + 3] = 0
  // 境目を1画素ぶん半透明にして、ギザギザを目立たなくする
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) continue
    const x = i % w
    const y = (i / w) | 0
    const nb = [x > 0 && seen[i - 1], x < w - 1 && seen[i + 1], y > 0 && seen[i - w], y < h - 1 && seen[i + w]].filter(Boolean).length
    if (nb >= 2 && isBg(i)) data[i * 4 + 3] = 110
  }
  return sharp(data, { raw: info }).trim({ threshold: 0 })
}

/**
 * 切り抜いた絵に、ステッカー風の白フチと外側の黒い線を付け直す。
 * 元の白フチは背景と同じ白で区切りが無く、塗りつぶしで一緒に消えてしまうため。
 */
const sticker = async (img, border = 9, line = 3) => {
  const pad = border + line + 4
  const base = await img.extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const { width, height } = await sharp(base).metadata()
  // アルファを膨らませたシルエット（ぼかして、少しでも色があれば不透明にする）。
  // sharpは1回の処理の中だと 2値化→ぼかし の順で実行してしまうので、2回に分ける
  const grow = async (r, color) => {
    const blurred = await sharp(base).extractChannel(3).blur(r / 2).png().toBuffer()
    const mask = await sharp(blurred).threshold(4).extractChannel(0).raw().toBuffer()
    const rgb = sharp({ create: { width, height, channels: 3, background: color } })
    return rgb.joinChannel(mask, { raw: { width, height, channels: 1 } }).png().toBuffer()
  }
  const outer = await grow(border + line, '#1e2230')
  const white = await grow(border, '#ffffff')
  return sharp(outer).composite([{ input: white }, { input: base }])
}

// 背景の判定をゆるめにして、元の白フチと影もまとめて消す
const full = await cutoutWhite(join(src, 'shurimaru-full.jpg'), 560)
const fullPng = await full.png().toBuffer()
await (await sticker(sharp(fullPng))).webp({ quality: 88, alphaQuality: 90 }).toFile(join(out, 'shurimaru-full.webp'))

// 右上に写り込む隣の人の髪を、白で塗りつぶす
const hide = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="573"><polygon points="316,0 420,0 420,210 411,210 408,160 399,110 382,72 362,46 336,26" fill="#ffffff"/></svg>',
)
await sharp(
  await sharp(join(src, 'shurimaru-point.jpg'))
    .extract({ left: 40, top: 392, width: 440, height: 600 })
    .resize({ width: 420, height: 573, fit: 'fill' })
    .composite([{ input: hide }])
    .png()
    .toBuffer(),
)
  .webp({ quality: 86 })
  .toFile(join(out, 'shurimaru-point.webp'))

await sharp(join(src, 'shurimaru-mic.jpg'))
  .extract({ left: 40, top: 260, width: 820, height: 700 })
  .resize({ width: 720 })
  .webp({ quality: 86 })
  .toFile(join(out, 'shurimaru-mic.webp'))

await sharp(join(src, 'family-castle.jpg'))
  .resize({ width: 720 })
  .webp({ quality: 86 })
  .toFile(join(out, 'family-castle.webp'))

console.log('done:', out)
