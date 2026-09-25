/** 文字列から32bitの種を作る */
const hash = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 種つきの乱数（mulberry32）。同じ種なら、誰の端末でも同じ並びになる。
 * 夫婦で同じ日に同じメニューが出るのは、日付を種にしているから。
 */
export const rng = (seed: string): (() => number) => {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** サイコロ。こちらは毎回ちがう目が出てほしいので、種なし */
export const rollDice = (count: number): number[] =>
  Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6))
