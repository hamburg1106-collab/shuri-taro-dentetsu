/**
 * BGMと効果音。音楽ファイルは使わず、ブラウザの音源（Web Audio）でファミコン風の音を鳴らす
 * （2026-09-27 決定。著作権の心配がなく、電波がなくても鳴る）。
 *
 * - work: 運動中。テンポの速い曲
 * - rest: 休憩中・準備中。ゆったりした曲
 * - カウントダウン: 休憩の残り5秒から「ピッ」、始まりで「ポーン」
 * - 読み上げの声が出ているあいだは、BGMの音量を下げる
 */

type Track = 'work' | 'rest'

const MUSIC_VOL = 0.16
const DUCK_VOL = 0.05
const SFX_VOL = 0.35

const STORAGE_KEY = 'shuritaro:music'

let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let noise: AudioBuffer | null = null

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
})()

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

/** ボタンを押した流れの中で呼ぶ。スマホは、こうしないと音が出ない */
export const unlockAudio = () => {
  try {
    // iPhoneのマナーモードでも鳴らす（対応しているSafariだけ）
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
      musicGain = ctx.createGain()
      musicGain.gain.value = MUSIC_VOL
      musicGain.connect(ctx.destination)
      sfxGain = ctx.createGain()
      sfxGain.gain.value = SFX_VOL
      sfxGain.connect(ctx.destination)
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
      const d = noise.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    void ctx.resume()
  } catch {
    // 音が出せない端末では、黙って何もしない
  }
}

const tone = (out: GainNode, freq: number, at: number, dur: number, type: OscillatorType, vol: number) => {
  if (!ctx) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(vol, at + 0.008)
  g.gain.setValueAtTime(vol, at + dur * 0.7)
  g.gain.linearRampToValueAtTime(0, at + dur)
  o.connect(g).connect(out)
  o.start(at)
  o.stop(at + dur + 0.02)
}

const hat = (at: number, vol: number) => {
  if (!ctx || !noise || !musicGain) return
  const s = ctx.createBufferSource()
  s.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7000
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, at)
  g.gain.exponentialRampToValueAtTime(0.001, at + 0.04)
  s.connect(f).connect(g).connect(musicGain)
  s.start(at)
}

// ---- 曲（1ステップ＝8分音符。0は休み。数字はMIDIのノート番号） ----

// 運動中: C → G → Am → F を2周。2周目はメロディを変える
const WORK_LEAD = [
  76, 79, 84, 79, 76, 79, 81, 79,
  74, 79, 83, 79, 74, 79, 81, 83,
  84, 83, 81, 76, 81, 83, 84, 88,
  86, 84, 81, 77, 79, 81, 83, 79,
  84, 0, 84, 83, 84, 88, 86, 84,
  83, 0, 83, 81, 83, 86, 84, 83,
  81, 0, 81, 79, 81, 84, 83, 81,
  77, 79, 81, 84, 83, 81, 79, 0,
]
const WORK_BASS = [48, 43, 45, 41, 48, 43, 45, 43] // 小節ごとの根音

// 休憩中: C → Am → F → G のアルペジオ
const REST_CHORDS = [
  [60, 64, 67, 72],
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [55, 59, 62, 67],
]

const TRACKS: Record<Track, { bpm: number; steps: number; play: (step: number, at: number, len: number) => void }> = {
  work: {
    bpm: 156,
    steps: WORK_LEAD.length,
    play: (s, at, len) => {
      if (!musicGain) return
      const n = WORK_LEAD[s]
      if (n) tone(musicGain, hz(n), at, len * 0.85, 'square', 0.22)
      const root = WORK_BASS[Math.floor(s / 8)]
      // ベースはオクターブを行き来する
      tone(musicGain, hz(s % 2 ? root + 12 : root), at, len * 0.9, 'triangle', 0.5)
      if (s % 2) hat(at, 0.25)
    },
  },
  rest: {
    bpm: 88,
    steps: 32,
    play: (s, at, len) => {
      if (!musicGain) return
      const chord = REST_CHORDS[Math.floor(s / 8)]
      const arp = [0, 1, 2, 3, 2, 1, 2, 1][s % 8]
      tone(musicGain, hz(chord[arp] + 12), at, len * 1.6, 'triangle', 0.35)
      if (s % 8 === 0) tone(musicGain, hz(chord[0] - 12), at, len * 7.5, 'sine', 0.4)
    },
  },
}

let current: Track | null = null
let timer: ReturnType<typeof setInterval> | null = null
let step = 0
let nextAt = 0

/** 先読みで少しずつ予約する（setTimeoutだけだとリズムが揺れるため） */
const pump = () => {
  if (!ctx || !current) return
  const t = TRACKS[current]
  const len = 60 / t.bpm / 2
  while (nextAt < ctx.currentTime + 0.15) {
    t.play(step, nextAt, len)
    nextAt += len
    step = (step + 1) % t.steps
  }
}

export const playMusic = (track: Track) => {
  if (!enabled || !ctx) return
  if (current === track && timer) return
  stopMusic()
  current = track
  step = 0
  nextAt = ctx.currentTime + 0.05
  pump()
  timer = setInterval(pump, 30)
}

export const stopMusic = () => {
  if (timer) clearInterval(timer)
  timer = null
  current = null
  // 予約済みの音を切るため、いったん音量を0にして戻す
  if (ctx && musicGain) {
    const now = ctx.currentTime
    musicGain.gain.cancelScheduledValues(now)
    musicGain.gain.setValueAtTime(0, now)
    musicGain.gain.setValueAtTime(speaking ? DUCK_VOL : MUSIC_VOL, now + 0.25)
  }
}

export const isMusicEnabled = () => enabled

export const setMusicEnabled = (on: boolean) => {
  enabled = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // 保存できなくても、この回だけは切り替わる
  }
  if (!on) stopMusic()
}

let speaking = false

/** 読み上げのあいだBGMを小さくする */
export const duck = (on: boolean) => {
  speaking = on
  if (!ctx || !musicGain || !current) return
  musicGain.gain.setTargetAtTime(on ? DUCK_VOL : MUSIC_VOL, ctx.currentTime, 0.08)
}

// ---- 効果音 ----

/** カウントダウンの「ピッ」 */
export const beep = () => {
  if (!ctx || !sfxGain) return
  tone(sfxGain, hz(81), ctx.currentTime + 0.01, 0.12, 'square', 0.5)
}

/** スタートの「ポーン」 */
export const go = () => {
  if (!ctx || !sfxGain) return
  tone(sfxGain, hz(93), ctx.currentTime + 0.01, 0.45, 'square', 0.5)
}

/** 完走のファンファーレ */
export const fanfare = () => {
  if (!ctx || !sfxGain) return
  const t = ctx.currentTime + 0.05
  // ド・ミ・ソ・ドー、ソ・ドーーー（かけ上がるだけの短いジングル）
  const notes: [number, number, number][] = [
    [72, 0, 0.12],
    [76, 0.13, 0.12],
    [79, 0.26, 0.12],
    [84, 0.39, 0.45],
    [79, 0.9, 0.12],
    [84, 1.05, 0.9],
  ]
  for (const [n, dt, d] of notes) {
    tone(sfxGain, hz(n + 12), t + dt, d, 'square', 0.35)
    tone(sfxGain, hz(n - 12), t + dt, d, 'triangle', 0.5)
  }
}
