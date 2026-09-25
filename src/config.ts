import type { Tag } from './data/exercises'

export const APP_NAME = 'しゅり太郎電鉄'

export type Role = 'danna' | 'omaru'

/** アプリ内の呼び名（2026-09-25 決定） */
export const ROLE_NAME: Record<Role, string> = {
  danna: 'だんなさん',
  omaru: 'おまる',
}

/** 1種目の運動と休憩（秒） */
export const WORK_SEC = 40
export const REST_SEC = 20
export const READY_SEC = 5
export const ITEMS_PER_DAY = 5

/** 曜日テーマ。0=日 … 6=土 */
export const DAY_THEMES: { name: string; short: string; tags: Tag[] | 'all' }[] = [
  { name: 'ゆる全身の日', short: 'ゆる全身', tags: ['gentle'] },
  { name: '下半身の日', short: '下半身', tags: ['lower'] },
  { name: '上半身の日', short: '上半身', tags: ['upper'] },
  { name: '体幹の日', short: '体幹', tags: ['core'] },
  { name: '有酸素の日', short: '有酸素', tags: ['cardio'] },
  { name: '全身の日', short: '全身', tags: 'all' },
  { name: '脚＋体幹の日', short: '脚＋体幹', tags: ['lower', 'core'] },
]

/** 今週のMVPのポイント */
export const POINT_PER_DAY = 10
export const POINT_PER_CHALLENGE = 3
