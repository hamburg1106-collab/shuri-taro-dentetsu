import { ROLE_NAME, type Role } from '../config'
import { MAP_LENGTH, MAPS } from '../data/maps'
import { label } from '../lib/date'
import { themeOf } from '../lib/menu'
import type { DayDoc, MainDoc } from '../types'
import { MapView } from './MapView'
import { Logo } from './parts'

type Props = {
  uid: string
  main: MainDoc
  today: DayDoc
  todayKey: string
  onStart: () => void
  onDice: () => void
  onGoal: () => void
  onReward: () => void
  onWeight: () => void
  onMvp: () => void
  onSettings: () => void
}

const uidOf = (main: MainDoc, role: Role) => Object.entries(main.members).find(([, m]) => m.role === role)?.[0]

export const HomeScreen = ({ uid, main, today, todayKey, onStart, onDice, onGoal, onReward, onWeight, onMvp, onSettings }: Props) => {
  const me = main.members[uid]
  const partnerRole: Role = me.role === 'danna' ? 'omaru' : 'danna'
  const partnerUid = uidOf(main, partnerRole)
  const iDone = !!today.done[uid]
  const partnerDone = !!(partnerUid && today.done[partnerUid])
  const pending = main.pending[uid]
  const atGoal = main.position >= MAP_LENGTH
  const map = MAPS[main.mapIndex]

  const note = (() => {
    if (iDone && partnerDone) return '今日は2人とも運行完了！また明日'
    if (!iDone && partnerDone) return `${ROLE_NAME[partnerRole]}はもう完了！あなたがやると サイコロ2個！`
    if (iDone && !partnerDone) return `${ROLE_NAME[partnerRole]}がやると、サイコロ2個振れるよ`
    return '先にやると1個、2人目は2個振れるよ'
  })()

  const row = (role: Role) => {
    const u = uidOf(main, role)
    const done = !!(u && today.done[u])
    return (
      <div className="today__row" key={role}>
        <span className={`avatar avatar--${role}`}>{role === 'danna' ? 'だ' : 'お'}</span>
        <span className="grow">
          {ROLE_NAME[role]}
          {u === uid && <span className="muted">（あなた）</span>}
        </span>
        {!u ? <span className="muted">まだ未登録</span> : done ? <span className="ok">✓ 完了</span> : <span className="muted">まだ</span>}
      </div>
    )
  }

  return (
    <div className="screen sea">
      <Logo />
      <MapView mapIndex={main.mapIndex} position={main.position} />

      <div className="win" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 800 }} className="muted">
          ゴールのご褒美
        </span>
        {main.mapReward ? (
          <span style={{ fontSize: 15, fontWeight: 800 }} className="hl">
            {main.mapReward}
          </span>
        ) : (
          <button className="chip" style={{ background: 'var(--red)', cursor: 'pointer' }} onClick={onReward}>
            ご褒美を決める
          </button>
        )}
      </div>

      <div className="win today">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
          <span>今日の運行</span>
          <span className="muted" style={{ fontSize: 12 }}>
            {label(todayKey)} {themeOf(todayKey).name}
          </span>
        </div>
        {row('danna')}
        {row('omaru')}
        <div className="note">{note}</div>
      </div>

      {(main.cards.reroll > 0 || main.plusOne > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {main.cards.reroll > 0 && <span className="chip">ふりなおしカード ×{main.cards.reroll}</span>}
          {main.plusOne > 0 && <span className="chip">次のサイコロ+1 ×{main.plusOne}</span>}
        </div>
      )}

      {atGoal ? (
        <button className="btn btn--yellow" onClick={onGoal}>
          {map.to} 到着！
          <span className="btn__sub">ゴールの発表を見る</span>
        </button>
      ) : pending ? (
        <button className="btn btn--yellow" onClick={onDice}>
          サイコロで進む
          <span className="btn__sub">振ったサイコロが {pending.dice.length}個 あります</span>
        </button>
      ) : iDone ? (
        <button className="btn btn--navy" disabled>
          今日の運行は終了
          <span className="btn__sub">また明日！</span>
        </button>
      ) : (
        <button className="btn" onClick={onStart}>
          今日の5分をはじめる
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <button className="link-btn" onClick={onWeight}>
          体重
        </button>
        <button className="link-btn" onClick={onMvp}>
          先週の決算
        </button>
        <button className="link-btn" onClick={onSettings}>
          設定
        </button>
      </div>
    </div>
  )
}
