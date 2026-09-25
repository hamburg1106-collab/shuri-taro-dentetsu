import { useState } from 'react'
import { ROLE_NAME, type Role } from '../config'
import { chooseRole } from '../lib/store'
import type { MainDoc } from '../types'
import { Logo, Talk } from './parts'

/** 初回だけ。「だんなさん」「おまる」のどちらかを選ぶ */
export const RolePick = ({ uid, main }: { uid: string; main: MainDoc }) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const taken = new Set(Object.entries(main.members).filter(([u]) => u !== uid).map(([, m]) => m.role))

  const pick = async (role: Role) => {
    setBusy(true)
    setError(null)
    try {
      await chooseRole(uid, role)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="screen sea">
      <Logo />
      <Talk>
        ようこそ、しゅり太郎電鉄へ！
        <br />
        あなたは、どっち？
      </Talk>
      <div className="grow" />
      {(['danna', 'omaru'] as Role[]).map((r) => (
        <button key={r} className={`btn ${r === 'danna' ? 'btn--blue' : ''}`} disabled={busy || taken.has(r)} onClick={() => void pick(r)}>
          {ROLE_NAME[r]}
          {taken.has(r) && <span className="btn__sub">（相手が選び済み）</span>}
        </button>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
