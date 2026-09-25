import { useEffect, useState, type ReactNode } from 'react'
import { POSES, type PoseName, type Pt } from '../data/poses'

export const IMG = {
  full: `${import.meta.env.BASE_URL}img/shurimaru-full.webp`,
  point: `${import.meta.env.BASE_URL}img/shurimaru-point.webp`,
  mic: `${import.meta.env.BASE_URL}img/shurimaru-mic.webp`,
  family: `${import.meta.env.BASE_URL}img/family-castle.webp`,
}

export const Logo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div className="logo" role="img" aria-label="しゅり太郎電鉄">
      <span className="layer l-shadow" aria-hidden>
        しゅり太郎電鉄
      </span>
      <span className="layer l-outer" aria-hidden>
        しゅり太郎電鉄
      </span>
      <span className="layer l-inner" aria-hidden>
        しゅり太郎電鉄
      </span>
      <span className="layer" aria-hidden>
        <span className="c-red">しゅり太郎</span>
        <span className="c-blue">電鉄</span>
      </span>
    </div>
    <div className="ribbon">〜 夫婦で日本縦断の旅 〜</div>
  </div>
)

/** しゅりまるのセリフ窓 */
export const Talk = ({ children, name = 'しゅりまる' }: { children: ReactNode; name?: string }) => (
  <div className="win win--talk">
    <div className="win__name">{name}</div>
    {children}
  </div>
)

const line = (a: Pt, b: Pt, key: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />

/** 棒人間。poses を順番に切り替えて動きに見せる */
export const StickFigure = ({ poses, interval = 800, paused = false }: { poses: PoseName[]; interval?: number; paused?: boolean }) => {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (poses.length < 2 || paused) return
    const t = setInterval(() => setI((n) => (n + 1) % poses.length), interval)
    return () => clearInterval(t)
  }, [poses, interval, paused])
  const p = POSES[poses[i % poses.length]]
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="#1e2230" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1={20} y1={194} x2={180} y2={194} stroke="#c9c0a8" strokeWidth={4} />
      {line(p.sh, p.hip, 'body')}
      {line(p.sh, p.le, 'lu')}
      {line(p.le, p.lh, 'll')}
      {line(p.sh, p.re, 'ru')}
      {line(p.re, p.rh, 'rl')}
      {line(p.hip, p.lk, 'lt')}
      {line(p.lk, p.lf, 'ls')}
      {line(p.hip, p.rk, 'rt')}
      {line(p.rk, p.rf, 'rs')}
      <circle cx={p.head[0]} cy={p.head[1]} r={15} fill="#fff" />
    </svg>
  )
}

const PIPS: Record<number, [number, number][]> = {
  1: [[60, 60]],
  2: [
    [36, 36],
    [84, 84],
  ],
  3: [
    [34, 34],
    [60, 60],
    [86, 86],
  ],
  4: [
    [36, 36],
    [84, 36],
    [36, 84],
    [84, 84],
  ],
  5: [
    [34, 34],
    [86, 34],
    [60, 60],
    [34, 86],
    [86, 86],
  ],
  6: [
    [36, 32],
    [84, 32],
    [36, 60],
    [84, 60],
    [36, 88],
    [84, 88],
  ],
}

export const Die = ({ value, rolling = false, tilt = 0 }: { value: number; rolling?: boolean; tilt?: number }) => (
  <svg viewBox="0 0 124 124" className={`die${rolling ? ' die--rolling' : ''}`} style={{ transform: `rotate(${tilt}deg)` }} role="img" aria-label={`${value}`}>
    <rect x="6" y="12" width="112" height="106" rx="20" fill="#1e2230" />
    <rect x="6" y="4" width="112" height="106" rx="20" fill="#fff" stroke="#1e2230" strokeWidth="5" />
    {PIPS[value].map(([x, y], i) => (
      <circle key={i} cx={x + 2} cy={y - 2} r={value === 1 ? 14 : 11} fill={value === 1 ? '#d93a2f' : '#1e2230'} />
    ))}
  </svg>
)

export const Back = ({ onClick, label = 'マップへもどる' }: { onClick: () => void; label?: string }) => (
  <button className="chip back" onClick={onClick}>
    ◀ {label}
  </button>
)
