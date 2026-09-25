import { useEffect, useState } from 'react'
import { ROLE_NAME, type Role } from '../config'
import { moveForward, reroll } from '../lib/store'
import type { AdvanceResult, MainDoc } from '../types'
import { Die, Talk } from './parts'

type Props = { uid: string; main: MainDoc; onMoved: (r: AdvanceResult) => void; onBack: () => void }

const ROLL_MS = 1200

export const DiceScreen = ({ uid, main, onMoved, onBack }: Props) => {
  const pending = main.pending[uid]
  const [rolling, setRolling] = useState(true)
  const [face, setFace] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const diceKey = pending?.dice.join(',') ?? ''

  // 目が変わる（振りなおし含む）たびに、転がる演出を入れる
  useEffect(() => {
    setRolling(true)
    const spin = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 90)
    const stop = setTimeout(() => {
      clearInterval(spin)
      setRolling(false)
    }, ROLL_MS)
    return () => {
      clearInterval(spin)
      clearTimeout(stop)
    }
  }, [diceKey])

  if (!pending) {
    return (
      <div className="screen sea screen--center">
        <Talk>振るサイコロがありません</Talk>
        <button className="btn" onClick={onBack}>
          マップへ
        </button>
      </div>
    )
  }

  const me = main.members[uid]
  const partner: Role = me.role === 'danna' ? 'omaru' : 'danna'
  const sum = pending.dice.reduce((a, b) => a + b, 0)
  const bonus = main.plusOne > 0 ? 1 : 0

  const heading = pending.reason === 'bonus' ? '夫婦ボーナス！' : pending.reason === 'challenge' ? 'チャレンジ成功！' : 'サイコロ！'
  const message =
    pending.reason === 'bonus'
      ? `${ROLE_NAME[me.role]}、おつかれさま！\n今日は2人とも運動したので\nサイコロ${pending.dice.length}個 を振れたぞ！`
      : pending.reason === 'challenge'
        ? 'おまけ運動、おつかれさま！\nサイコロをもう1個！'
        : `${ROLE_NAME[me.role]}、おつかれさま！\n${ROLE_NAME[partner]}が後からやると、2個振れるよ`

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen sea screen--center">
      <h1 className="title3d" style={{ fontSize: 34, marginTop: 20 }}>
        {heading}
      </h1>
      <div className="dice-row">
        {pending.dice.map((v, i) => (
          <Die key={i} value={rolling ? ((face + i * 2) % 6) + 1 : v} rolling={rolling} tilt={i % 2 ? 8 : -10} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, visibility: rolling ? 'hidden' : 'visible' }}>
        <span className="big-num" style={{ fontSize: 80 }}>
          {sum + bonus}
        </span>
        <span className="title3d" style={{ fontSize: 26, transform: 'none' }}>
          マス進む！
        </span>
      </div>
      {bonus > 0 && !rolling && <span className="chip">次のサイコロ+1 を使いました</span>}

      <Talk>
        <span style={{ whiteSpace: 'pre-line' }}>{message}</span>
      </Talk>

      <div className="grow" />
      {error && <p className="error">{error}</p>}
      {main.cards.reroll > 0 && (
        <button className="btn btn--navy btn--small" disabled={busy || rolling} onClick={() => void run(() => reroll(uid))}>
          ふりなおしカードを使う（のこり{main.cards.reroll}枚）
        </button>
      )}
      <button className="btn" disabled={busy || rolling} onClick={() => void run(async () => onMoved(await moveForward(uid)))}>
        すすむ
      </button>
    </div>
  )
}
