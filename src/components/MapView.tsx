import { useEffect, useMemo, useRef } from 'react'
import { MAP_LENGTH, MAPS, squaresOf, type SquareKind } from '../data/maps'
import { rng } from '../lib/random'

const W = 358
const PER_ROW = 11
const ROW_GAP = 86
const TOP = 70
const BOTTOM = 60
const ROWS = Math.ceil((MAP_LENGTH + 1) / PER_ROW)
const H = TOP + (ROWS - 1) * ROW_GAP + BOTTOM

const posOf = (i: number): [number, number] => {
  const r = Math.floor(i / PER_ROW)
  let c = i % PER_ROW
  if (r % 2 === 1) c = PER_ROW - 1 - c
  return [32 + c * 29, H - BOTTOM - r * ROW_GAP]
}

const FILL: Record<SquareKind, string> = {
  normal: '#ffffff',
  reward: '#2f6fd0',
  challenge: '#f2c200',
  station: '#d93a2f',
}

/** 波打つ海岸線の陸地 */
const landPath = (): string => {
  const pts: string[] = []
  const wave = (y: number, base: number, amp: number) => base + Math.sin(y / 70) * amp
  pts.push(`M${wave(28, 12, 5)},28`)
  for (let x = 40; x <= W - 20; x += 40) pts.push(`L${x},${28 + Math.sin(x / 50) * 8}`)
  for (let y = 28; y <= H - 18; y += 30) pts.push(`L${wave(y, W - 12, 6)},${y}`)
  for (let x = W - 40; x >= 20; x -= 40) pts.push(`L${x},${H - 18 + Math.sin(x / 45) * 6}`)
  for (let y = H - 18; y >= 28; y -= 30) pts.push(`L${wave(y + 35, 12, 6)},${y}`)
  return pts.join(' ') + ' Z'
}

type Deco = { kind: 'mountain' | 'tree'; x: number; y: number; s: number }

const decorations = (mapId: string): Deco[] => {
  const r = rng(`deco:${mapId}`)
  const out: Deco[] = []
  for (let row = 0; row < ROWS - 1; row++) {
    // 行と行のすき間（上下に線路がある）に収まる大きさにする
    const y = H - BOTTOM - row * ROW_GAP - ROW_GAP / 2 + 8
    const n = 1 + Math.floor(r() * 3)
    for (let k = 0; k < n; k++) {
      out.push({ kind: r() < 0.45 ? 'mountain' : 'tree', x: 60 + r() * (W - 120), y, s: 0.6 + r() * 0.3 })
    }
  }
  return out
}

/** 桃鉄風の路線図。全250マスを縦に並べ、コマの位置まで自動でスクロールする */
export const MapView = ({ mapIndex, position }: { mapIndex: number; position: number }) => {
  const map = MAPS[mapIndex]
  const squares = useMemo(() => squaresOf(map), [map])
  const deco = useMemo(() => decorations(map.id), [map.id])
  const land = useMemo(landPath, [])
  const rail = useMemo(
    () =>
      Array.from({ length: MAP_LENGTH + 1 }, (_, i) => posOf(i))
        .map(([x, y]) => `${x},${y}`)
        .join(' '),
    [],
  )
  const scroller = useRef<HTMLDivElement>(null)
  const [kx, ky] = posOf(Math.min(position, MAP_LENGTH))

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const scale = el.scrollHeight / H
    el.scrollTo({ top: ky * scale - el.clientHeight / 2, behavior: 'smooth' })
  }, [ky])

  return (
    <div className="mapbox sea">
      <div className="mapbox__scroll" ref={scroller}>
        <svg viewBox={`0 0 ${W} ${H}`} aria-label={`${map.title}の路線図。いま${position}マス目`}>
          <path d={land} fill="#3f8a2e" stroke="#1e2230" strokeWidth={2.5} transform="translate(0,7)" />
          <path d={land} fill="#6cc04a" stroke="#1e2230" strokeWidth={2.5} />
          {deco.map((d, i) =>
            d.kind === 'mountain' ? (
              <g key={i} transform={`translate(${d.x},${d.y}) scale(${d.s})`}>
                <path d="M-28,20 L0,-22 L28,20 Z" fill="#8b6b3e" stroke="#1e2230" strokeWidth={2} />
                <path d="M-8,-10 L0,-22 L8,-10 L0,-6 Z" fill="#fff" />
              </g>
            ) : (
              <g key={i} transform={`translate(${d.x},${d.y}) scale(${d.s})`}>
                <circle cx={-8} cy={6} r={9} fill="#2e7a2a" stroke="#1e2230" strokeWidth={2} />
                <circle cx={7} cy={10} r={7} fill="#2e7a2a" stroke="#1e2230" strokeWidth={2} />
              </g>
            ),
          )}
          <polyline points={rail} fill="none" stroke="#1e2230" strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={rail} fill="none" stroke="#fff" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
          {squares.map((k, i) => {
            const [x, y] = posOf(i)
            const passed = i < position
            return (
              <g key={i} opacity={passed ? 0.5 : 1}>
                {k === 'station' ? (
                  <>
                    <rect x={x - 13} y={y - 10} width={26} height={26} rx={4} fill="#1e2230" />
                    <rect x={x - 13} y={y - 13} width={26} height={26} rx={4} fill={FILL.station} stroke="#1e2230" strokeWidth={2.5} />
                    <rect x={x - 9} y={y - 9} width={18} height={18} rx={2} fill="none" stroke="#fff" strokeWidth={2} />
                  </>
                ) : (
                  <>
                    <circle cx={x} cy={y + 3} r={11} fill="#1e2230" />
                    <circle cx={x} cy={y} r={11} fill={FILL[k]} stroke="#1e2230" strokeWidth={2.5} />
                  </>
                )}
              </g>
            )
          })}
          {map.stations.map((s) => {
            const [x, y] = posOf(s.at)
            const w = s.name.length * 12 + 16
            return (
              <g key={s.at} transform={`translate(${Math.min(Math.max(x, w / 2 + 6), W - w / 2 - 6)},${y - 36})`}>
                <rect x={-w / 2} y={-10} width={w} height={20} rx={5} fill="#1b2a6b" stroke="#fff" strokeWidth={2} />
                <rect x={-w / 2 - 2} y={-12} width={w + 4} height={24} rx={6} fill="none" stroke="#1e2230" strokeWidth={2} />
                <text y={5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={800}>
                  {s.name}
                </text>
              </g>
            )
          })}
          <g transform={`translate(${kx - 23},${ky - 44})`}>
            <rect x={18} y={0} width={7} height={10} fill="#1e2230" />
            <rect x={15} y={0} width={13} height={4} rx={1} fill="#1e2230" />
            <rect x={4} y={10} width={26} height={16} rx={7} fill="#e8423a" stroke="#1e2230" strokeWidth={2.5} />
            <rect x={28} y={4} width={15} height={22} rx={2} fill="#1b2a6b" stroke="#1e2230" strokeWidth={2.5} />
            <rect x={32} y={8} width={7} height={6} rx={1} fill="#ffd23f" />
            <circle cx={7} cy={18} r={3} fill="#ffd23f" stroke="#1e2230" strokeWidth={1.5} />
            <circle cx={13} cy={31} r={5} fill="#1e2230" />
            <circle cx={26} cy={31} r={5} fill="#1e2230" />
            <circle cx={37} cy={31} r={5} fill="#1e2230" />
          </g>
        </svg>
      </div>
      <div className="mapbox__info">
        <span style={{ fontSize: 10 }}>
          マップ{mapIndex + 1}　{map.title}
        </span>
        <span>
          目的地 <span className="hl" style={{ fontSize: 17 }}>{map.to}</span>　あと{' '}
          <span className="hl" style={{ fontSize: 17 }}>{Math.max(MAP_LENGTH - position, 0)}</span> マス
        </span>
      </div>
      <div className="mapbox__legend">
        <span>
          <span className="dot" style={{ background: '#2f6fd0' }} />
          ご褒美
        </span>
        <span>
          <span className="dot" style={{ background: '#f2c200' }} />
          チャレンジ
        </span>
        <span>
          <span className="dot" style={{ background: '#d93a2f', borderRadius: 2 }} />駅
        </span>
      </div>
    </div>
  )
}
