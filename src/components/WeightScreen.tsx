import { useMemo, useState, type PointerEvent } from 'react'
import { ROLE_NAME, type Role } from '../config'
import { addDays, dateKey, label } from '../lib/date'
import { saveWeight } from '../lib/store'
import type { MainDoc, Weight } from '../types'
import { Back } from './parts'

const COLOR: Record<Role, string> = { danna: '#2f6fd0', omaru: '#d0587e' }
const DAYS = 60

const W = 340
const H = 200
const PAD = { l: 36, r: 12, t: 12, b: 24 }

/** 2人の体重の推移（最大60日）。2人とも相手の数値も見える（2026-09-25 決定） */
export const WeightScreen = ({ uid, main, weights, onBack }: { uid: string; main: MainDoc; weights: Weight[]; onBack: () => void }) => {
  const today = dateKey()
  const mine = weights.find((w) => w.uid === uid && w.date === today)
  const [text, setText] = useState(mine ? String(mine.kg) : '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const start = addDays(today, -(DAYS - 1))
  const dates = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(start, i)), [start])
  const series = useMemo(
    () =>
      Object.entries(main.members).map(([u, m]) => ({
        uid: u,
        role: m.role,
        points: weights.filter((w) => w.uid === u && w.date >= start).map((w) => ({ i: dates.indexOf(w.date), kg: w.kg, date: w.date })),
      })),
    [main.members, weights, start, dates],
  )
  const all = series.flatMap((s) => s.points.map((p) => p.kg))
  const lo = all.length ? Math.floor(Math.min(...all) - 1) : 50
  const hi = all.length ? Math.ceil(Math.max(...all) + 1) : 70
  const x = (i: number) => PAD.l + (i / (DAYS - 1)) * (W - PAD.l - PAD.r)
  const y = (kg: number) => PAD.t + (1 - (kg - lo) / Math.max(hi - lo, 1)) * (H - PAD.t - PAD.b)
  const ticks = [lo, Math.round((lo + hi) / 2), hi]

  const save = async () => {
    const kg = Number(text.replace(',', '.'))
    if (!Number.isFinite(kg) || kg < 20 || kg > 250) {
      setMsg('体重は kg で入れてください（例：62.4）')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      await saveWeight(uid, Math.round(kg * 10) / 10)
      setMsg('記録しました')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (DAYS - 1))
    setHover(i >= 0 && i < DAYS ? i : null)
  }

  const recent = [...weights].filter((w) => w.date >= addDays(today, -6)).sort((a, b) => b.date.localeCompare(a.date) || a.uid.localeCompare(b.uid))

  return (
    <div className="screen sea">
      <Back onClick={onBack} />
      <h1 className="title3d" style={{ fontSize: 32 }}>
        体重
      </h1>

      <div className="win" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <label className="field grow">
          今日の体重（kg）
          <input inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} placeholder="62.4" />
        </label>
        <button className="btn btn--small" style={{ width: 100, marginBottom: 0 }} disabled={busy || !text} onClick={() => void save()}>
          記録
        </button>
      </div>
      {msg && <p className="note">{msg}</p>}

      <div style={{ background: '#fff', color: 'var(--ink)', borderRadius: 10, border: '3px solid #fff', boxShadow: '0 0 0 3px var(--ink)', padding: 10 }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
          {series.map((s) => (
            <span key={s.uid} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 3, background: COLOR[s.role], borderRadius: 2 }} />
              {ROLE_NAME[s.role]}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: '#5b6275' }}>直近{DAYS}日</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', touchAction: 'pan-y' }} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="2人の体重の推移">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#e6e2d8" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#5b6275">
                {t}
              </text>
            </g>
          ))}
          <text x={PAD.l} y={H - 6} fontSize={10} fill="#5b6275">
            {label(start)}
          </text>
          <text x={W - PAD.r} y={H - 6} fontSize={10} fill="#5b6275" textAnchor="end">
            今日
          </text>
          {series.map((s) => (
            <g key={s.uid}>
              <polyline points={s.points.map((p) => `${x(p.i)},${y(p.kg)}`).join(' ')} fill="none" stroke={COLOR[s.role]} strokeWidth={2} strokeLinejoin="round" />
              {s.points.map((p) => (
                <circle key={p.date} cx={x(p.i)} cy={y(p.kg)} r={4} fill={COLOR[s.role]} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#1e2230" strokeWidth={1} strokeDasharray="3 3" />}
        </svg>
        {hover !== null && (
          <div style={{ fontSize: 12, fontWeight: 800, display: 'flex', gap: 12 }}>
            <span>{label(dates[hover])}</span>
            {series.map((s) => {
              const p = s.points.find((q) => q.i === hover)
              return (
                <span key={s.uid} style={{ color: '#1e2230' }}>
                  {ROLE_NAME[s.role]} {p ? `${p.kg}kg` : '—'}
                </span>
              )
            })}
          </div>
        )}
        {all.length === 0 && <p style={{ margin: 0, fontSize: 12, color: '#5b6275' }}>まだ記録がありません。上から今日の体重を入れてみよう</p>}
      </div>

      {recent.length > 0 && (
        <div className="win">
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }} className="muted">
            この1週間の記録
          </div>
          {recent.map((w) => (
            <div key={`${w.date}_${w.uid}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '2px 0' }}>
              <span>{label(w.date)}</span>
              <span>{ROLE_NAME[main.members[w.uid]?.role ?? 'danna']}</span>
              <span>{w.kg} kg</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
