import { useState } from 'react'
import { ROLE_NAME } from '../config'
import { EXERCISES } from '../data/exercises'
import { logout } from '../lib/auth'
import { setLevel } from '../lib/store'
import type { MainDoc } from '../types'
import { Back } from './parts'

export const SettingsScreen = ({ uid, main, onBack }: { uid: string; main: MainDoc; onBack: () => void }) => {
  const me = main.members[uid]
  const levels = me.levels ?? {}
  const [copied, setCopied] = useState(false)

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid)
      setCopied(true)
    } catch {
      prompt('このIDをコピーしてください', uid)
    }
  }

  return (
    <div className="screen sea">
      <Back onClick={onBack} />
      <h1 className="title3d" style={{ fontSize: 32 }}>
        設定
      </h1>

      <div className="win">
        <div style={{ fontWeight: 800 }}>
          あなたは <span className="hl">{ROLE_NAME[me.role]}</span>
        </div>
      </div>

      <div className="win">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>種目の強さ</div>
        {EXERCISES.filter((e) => e.easy).map((e) => {
          const lv = levels[e.id] ?? 'normal'
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '2px dotted #5b6fa8' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{e.name}</span>
              <button className="level" onClick={() => void setLevel(uid, e.id, lv === 'easy' ? 'normal' : 'easy')}>
                {lv === 'easy' ? 'やさしい' : 'ふつう'} ⇄
              </button>
            </div>
          )
        })}
        <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
          やさしい版: {EXERCISES.filter((e) => e.easy).map((e) => e.easy!.name).join('、')}
        </p>
      </div>

      <div className="win">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>アカウント</div>
        <p className="muted" style={{ fontSize: 12, margin: '0 0 6px', wordBreak: 'break-all' }}>
          ID: {uid}
        </p>
        <button className="btn btn--navy btn--small" onClick={() => void copyUid()}>
          {copied ? 'コピーしました' : 'IDをコピー'}
        </button>
        <button className="btn btn--navy btn--small" onClick={() => void logout()}>
          ログアウト
        </button>
      </div>
      <p className="muted" style={{ fontSize: 11, textAlign: 'center' }}>
        しゅり太郎電鉄 v{__APP_VERSION__}
      </p>
    </div>
  )
}
