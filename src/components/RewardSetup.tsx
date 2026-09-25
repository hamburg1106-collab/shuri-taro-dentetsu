import { useState } from 'react'
import { MAPS } from '../data/maps'
import { nextMapIndex } from '../lib/game'
import { setMapReward, startNextMap } from '../lib/store'
import type { MainDoc } from '../types'
import { Back, Talk } from './parts'

/**
 * ゴールのご褒美を2人で決めて登録する。
 * mode="current" はいまのマップのご褒美、"next" はゴール後に次のマップを始めるとき。
 */
export const RewardSetup = ({ main, mode, onDone, onBack }: { main: MainDoc; mode: 'current' | 'next'; onDone: () => void; onBack: () => void }) => {
  const [text, setText] = useState(mode === 'current' ? main.mapReward : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const map = MAPS[mode === 'next' ? nextMapIndex(main.mapIndex, MAPS.length) : main.mapIndex]
  const lap = mode === 'next' && main.mapIndex === MAPS.length - 1

  const save = async () => {
    const v = text.trim()
    if (!v) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'next') await startNextMap(v)
      else await setMapReward(v)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="screen sea">
      <Back onClick={onBack} label="もどる" />
      <h1 className="title3d" style={{ fontSize: 30 }}>
        {mode === 'next' ? '次の目的地は…' : 'ゴールのご褒美'}
      </h1>
      {mode === 'next' && (
        <div className="win" style={{ textAlign: 'center' }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>
            マップ{MAPS.indexOf(map) + 1}
            {lap && '（もう一周！）'}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26 }} className="hl">
            {map.title}
          </div>
        </div>
      )}
      <Talk>
        {map.to}にゴールしたら、なにする？
        <br />
        2人で決めて、書いておこう！
      </Talk>
      <label className="field">
        ゴールのご褒美
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="例：焼肉ディナー" maxLength={40} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="grow" />
      <button className="btn" disabled={busy || !text.trim()} onClick={() => void save()}>
        {mode === 'next' ? '出発進行！' : 'これに決めた！'}
      </button>
    </div>
  )
}
