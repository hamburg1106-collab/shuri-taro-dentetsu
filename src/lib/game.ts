import { CHALLENGES } from '../data/exercises'
import { MAP_LENGTH, squareKind, stationAt } from '../data/maps'
import type { AdvanceResult, DayDoc, MainDoc, Pending, RewardKind } from '../types'

/**
 * ゲームのルール。Firestoreに触らない純粋な計算だけを置く。
 * 保存（トランザクション）は store.ts が、ここで出した差分を書き込む。
 */

/** 運動を終えたときに振れるサイコロの数。その日2人目なら2個（夫婦ボーナス） */
export const diceForCompletion = (day: DayDoc, uid: string): { count: number; reason: 'normal' | 'bonus' } | null => {
  if (day.done[uid]) return null // 1日1回まで
  const second = day.order.some((u) => u !== uid)
  return second ? { count: 2, reason: 'bonus' } : { count: 1, reason: 'normal' }
}

/** 振ったサイコロを、進め忘れのぶんに足す */
export const mergePending = (prev: Pending | undefined, dice: number[], reason: Pending['reason']): Pending =>
  prev ? { dice: [...prev.dice, ...dice], reason: reason === 'bonus' ? 'bonus' : prev.reason } : { dice, reason }

const pickReward = (x: number): RewardKind => (x < 0.4 ? 'reroll' : x < 0.75 ? 'plusOne' : 'advance3')

/**
 * コマを進める。r は乱数（ご褒美とチャレンジの中身を決める）。
 * 返す patch は main に書く差分（ドット区切りのキーはフィールドのパス）。
 */
export const advance = (
  main: MainDoc,
  uid: string,
  r: () => number,
): { result: AdvanceResult; patch: Record<string, unknown> } => {
  const p = main.pending[uid]
  if (!p || p.dice.length === 0) throw new Error('進めるサイコロがありません')

  const bonus = main.plusOne > 0 ? 1 : 0
  const total = p.dice.reduce((a, b) => a + b, 0) + bonus
  const from = main.position
  let to = Math.min(from + total, MAP_LENGTH)
  let goal = to >= MAP_LENGTH
  const kind = goal ? 'station' : squareKind(main.mapIndex, to)

  let reward: RewardKind | undefined
  let challengeId: string | undefined
  if (!goal && kind === 'reward') {
    reward = pickReward(r())
    if (reward === 'advance3') {
      // 3マス進んだ先ではイベントを起こさない（連鎖すると分かりにくいため）
      to = Math.min(to + 3, MAP_LENGTH)
      goal = to >= MAP_LENGTH
    }
  }
  if (!goal && kind === 'challenge') {
    challengeId = CHALLENGES[Math.floor(r() * CHALLENGES.length)].id
  }

  const station = stationAt(main.mapIndex, to)

  const patch: Record<string, unknown> = {
    position: to,
    plusOne: main.plusOne - bonus + (reward === 'plusOne' ? 1 : 0),
    'cards.reroll': main.cards.reroll + (reward === 'reroll' ? 1 : 0),
  }

  return {
    result: { dice: p.dice, reason: p.reason, bonus, total, from, to, kind, reward, challengeId, station, goal },
    patch,
  }
}

/** 次のマップへ。3枚目のあとは1枚目に戻る */
export const nextMapIndex = (current: number, count: number): number => (current + 1) % count
