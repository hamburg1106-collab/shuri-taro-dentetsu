import type { Role } from './config'
import type { Level } from './data/exercises'
import type { SquareKind, Station } from './data/maps'

export type Member = { role: Role; levels?: Record<string, Level> }

export type RollReason = 'normal' | 'bonus' | 'challenge'

/** 振ったが、まだコマを進めていないサイコロ */
export type Pending = { dice: number[]; reason: RollReason }

export type MainDoc = {
  members: Record<string, Member>
  mapIndex: number
  position: number
  mapReward: string
  cards: { reroll: number }
  /** 次のサイコロ+1 の残り */
  plusOne: number
  pending: Record<string, Pending>
  /** MVP発表を見た週（その週の月曜） */
  mvpSeen: Record<string, string>
}

export type DayDoc = {
  /** 終えた時刻（ミリ秒） */
  done: Record<string, number>
  /** 終えた順。2人目の判定に使う */
  order: string[]
  challenges: Record<string, number>
}

export type Weight = { uid: string; date: string; kg: number }

export type RewardKind = 'reroll' | 'plusOne' | 'advance3'

export type AdvanceResult = {
  dice: number[]
  reason: RollReason
  bonus: number
  total: number
  from: number
  to: number
  kind: SquareKind
  reward?: RewardKind
  challengeId?: string
  station?: Station
  goal: boolean
}

export const EMPTY_MAIN: MainDoc = {
  members: {},
  mapIndex: 0,
  position: 0,
  mapReward: '',
  cards: { reroll: 0 },
  plusOne: 0,
  pending: {},
  mvpSeen: {},
}

export const EMPTY_DAY: DayDoc = { done: {}, order: [], challenges: {} }
