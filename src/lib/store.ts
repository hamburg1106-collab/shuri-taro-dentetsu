import {
  collection,
  deleteField,
  doc,
  documentId,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAt,
  updateDoc,
} from 'firebase/firestore'
import type { Role } from '../config'
import type { Level } from '../data/exercises'
import { MAP_LENGTH, MAPS } from '../data/maps'
import { EMPTY_DAY, EMPTY_MAIN, type AdvanceResult, type DayDoc, type MainDoc, type Weight } from '../types'
import { dateKey } from './date'
import { db } from './firebase'
import { advance, diceForCompletion, mergePending, nextMapIndex } from './game'
import { rollDice } from './random'

/**
 * 夫婦のデータは shuritaro/main の1か所。
 * 利用者は2人で固定なので、招待コードで組を作る仕組みは持たない。
 */
const mainRef = doc(db, 'shuritaro', 'main')
const dayRef = (key: string) => doc(db, 'shuritaro', 'main', 'days', key)
const rollsCol = collection(db, 'shuritaro', 'main', 'rolls')
const weightsCol = collection(db, 'shuritaro', 'main', 'weights')

const toMain = (data: Partial<MainDoc> | undefined): MainDoc => ({
  ...EMPTY_MAIN,
  ...data,
  cards: { ...EMPTY_MAIN.cards, ...data?.cards },
  members: data?.members ?? {},
  pending: data?.pending ?? {},
  mvpSeen: data?.mvpSeen ?? {},
})

const toDay = (data: Partial<DayDoc> | undefined): DayDoc => ({
  done: data?.done ?? {},
  order: data?.order ?? [],
  challenges: data?.challenges ?? {},
})

export const watchMain = (onChange: (m: MainDoc) => void, onError: (e: Error) => void) =>
  onSnapshot(mainRef, (s) => onChange(toMain(s.data() as Partial<MainDoc> | undefined)), onError)

/** from 以降の days をまとめて見る（今日の状況と、MVPの計算に使う） */
export const watchDays = (from: string, onChange: (days: Record<string, DayDoc>) => void) =>
  onSnapshot(
    query(collection(db, 'shuritaro', 'main', 'days'), orderBy(documentId()), startAt(from)),
    (s) => {
      const out: Record<string, DayDoc> = {}
      s.forEach((d) => {
        out[d.id] = toDay(d.data() as Partial<DayDoc>)
      })
      onChange(out)
    },
  )

export const watchWeights = (onChange: (w: Weight[]) => void) =>
  onSnapshot(weightsCol, (s) => {
    const out: Weight[] = []
    s.forEach((d) => out.push(d.data() as Weight))
    out.sort((a, b) => a.date.localeCompare(b.date))
    onChange(out)
  })

// ---- 初回：だんなさん／おまるを選ぶ ----

export const chooseRole = async (uid: string, role: Role): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const main = toMain((await tx.get(mainRef)).data() as Partial<MainDoc> | undefined)
    const taken = Object.entries(main.members).some(([u, m]) => u !== uid && m.role === role)
    if (taken) throw new Error('その役はもう相手が選んでいます')
    tx.set(mainRef, { members: { [uid]: { role } } }, { merge: true })
  })
}

export const setLevel = (uid: string, exerciseId: string, level: Level) =>
  updateDoc(mainRef, { [`members.${uid}.levels.${exerciseId}`]: level })

// ---- 運動を終えた ----

/** 運動を終えたことを記録し、サイコロを振る。すでに今日やっていれば null */
export const completeWorkout = async (uid: string): Promise<number[] | null> => {
  const key = dateKey()
  return runTransaction(db, async (tx) => {
    const mainSnap = await tx.get(mainRef)
    const daySnap = await tx.get(dayRef(key))
    const main = toMain(mainSnap.data() as Partial<MainDoc> | undefined)
    const day = daySnap.exists() ? toDay(daySnap.data() as Partial<DayDoc>) : EMPTY_DAY
    const grant = diceForCompletion(day, uid)
    if (!grant) return null
    const dice = rollDice(grant.count)
    tx.set(
      dayRef(key),
      { done: { ...day.done, [uid]: Date.now() }, order: [...day.order, uid], challenges: day.challenges },
      { merge: true },
    )
    tx.set(mainRef, { pending: { [uid]: mergePending(main.pending[uid], dice, grant.reason) } }, { merge: true })
    return dice
  })
}

/** チャレンジ成功。サイコロをもう1個 */
export const completeChallenge = async (uid: string): Promise<void> => {
  const key = dateKey()
  await runTransaction(db, async (tx) => {
    const mainSnap = await tx.get(mainRef)
    const daySnap = await tx.get(dayRef(key))
    const main = toMain(mainSnap.data() as Partial<MainDoc> | undefined)
    const day = daySnap.exists() ? toDay(daySnap.data() as Partial<DayDoc>) : EMPTY_DAY
    tx.set(dayRef(key), { challenges: { ...day.challenges, [uid]: (day.challenges[uid] ?? 0) + 1 } }, { merge: true })
    tx.set(mainRef, { pending: { [uid]: mergePending(main.pending[uid], rollDice(1), 'challenge') } }, { merge: true })
  })
}

/** ふりなおしカードを使う */
export const reroll = async (uid: string): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const main = toMain((await tx.get(mainRef)).data() as Partial<MainDoc> | undefined)
    const p = main.pending[uid]
    if (!p) throw new Error('振りなおすサイコロがありません')
    if (main.cards.reroll <= 0) throw new Error('ふりなおしカードがありません')
    tx.update(mainRef, {
      [`pending.${uid}.dice`]: rollDice(p.dice.length),
      'cards.reroll': main.cards.reroll - 1,
    })
  })
}

/** コマを進める */
export const moveForward = async (uid: string): Promise<AdvanceResult> => {
  const key = dateKey()
  return runTransaction(db, async (tx) => {
    const main = toMain((await tx.get(mainRef)).data() as Partial<MainDoc> | undefined)
    const { result, patch } = advance(main, uid, Math.random)
    tx.update(mainRef, { ...patch, [`pending.${uid}`]: deleteField() })
    tx.set(doc(rollsCol), {
      uid,
      date: key,
      at: Date.now(),
      map: MAPS[main.mapIndex].id,
      dice: result.dice,
      reason: result.reason,
      bonus: result.bonus,
      from: result.from,
      to: result.to,
      square: result.kind,
      reward: result.reward ?? null,
    })
    return result
  })
}

// ---- マップとご褒美 ----

export const setMapReward = (reward: string) => setDoc(mainRef, { mapReward: reward }, { merge: true })

/** ゴールしたあと、次のマップを始める */
export const startNextMap = async (reward: string): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const main = toMain((await tx.get(mainRef)).data() as Partial<MainDoc> | undefined)
    if (main.position < MAP_LENGTH) throw new Error('まだゴールしていません')
    tx.update(mainRef, {
      mapIndex: nextMapIndex(main.mapIndex, MAPS.length),
      position: 0,
      mapReward: reward,
      // 前のマップで振ったまま進めていないサイコロは、新しいマップに持ち越す
    })
  })
}

export const markMvpSeen = (uid: string, week: string) => updateDoc(mainRef, { [`mvpSeen.${uid}`]: week })

// ---- 体重 ----

export const saveWeight = (uid: string, kg: number) => {
  const date = dateKey()
  return setDoc(doc(weightsCol, `${date}_${uid}`), { uid, date, kg })
}
