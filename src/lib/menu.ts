import { DAY_THEMES, ITEMS_PER_DAY } from '../config'
import { EXERCISES, type Exercise } from '../data/exercises'
import { addDays, weekday } from './date'
import { rng } from './random'

const pool = (key: string): Exercise[] => {
  const theme = DAY_THEMES[weekday(key)]
  if (theme.tags === 'all') return EXERCISES.filter((e) => !e.tags.every((t) => t === 'gentle'))
  const tags = theme.tags
  return EXERCISES.filter((e) => e.tags.some((t) => tags.includes(t)))
}

const pick = (key: string, avoid: Set<string>): Exercise[] => {
  const r = rng(`menu:${key}`)
  const all = pool(key)
  // 前日と同じ種目は、候補が足りる限り外す
  const fresh = all.filter((e) => !avoid.has(e.id))
  const src = fresh.length >= ITEMS_PER_DAY ? fresh : all
  const shuffled = [...src]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, ITEMS_PER_DAY)
}

/**
 * その日のメニュー。日付だけで決まるので、夫婦で同じ日に同じメニューになる。
 * 前日のメニューは「前々日を避けずに作った前日」で近似する（連鎖させると計算が重くなるため）。
 */
export const menuOf = (key: string): Exercise[] => {
  const yesterday = pick(addDays(key, -1), new Set())
  return pick(key, new Set(yesterday.map((e) => e.id)))
}

export const themeOf = (key: string) => DAY_THEMES[weekday(key)]
