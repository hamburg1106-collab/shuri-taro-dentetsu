import { useEffect, useMemo, useRef, useState } from 'react'
import { READY_SEC, REST_SEC, WORK_SEC } from '../config'
import type { PoseName } from '../data/poses'
import { beep, fanfare, go, isMusicEnabled, playMusic, setMusicEnabled, stopMusic } from '../lib/music'
import { keepAwake, setSpeechEnabled, speak } from '../lib/speech'

/** 休憩・準備の残り何秒から「ピッ」と鳴らすか */
const COUNTDOWN_SEC = 5
import { StickFigure } from './parts'

export type WorkItem = { name: string; point: string; poses: PoseName[]; switchSides?: boolean }

type Phase = { kind: 'ready' | 'work' | 'rest'; i: number; sec: number }

const buildPhases = (n: number): Phase[] => {
  const out: Phase[] = [{ kind: 'ready', i: 0, sec: READY_SEC }]
  for (let i = 0; i < n; i++) {
    out.push({ kind: 'work', i, sec: WORK_SEC })
    if (i < n - 1) out.push({ kind: 'rest', i: i + 1, sec: REST_SEC })
  }
  return out
}

type Props = { items: WorkItem[]; onFinish: () => void; onQuit: () => void }

/**
 * 運動中。40秒運動→20秒休憩を種目の数だけ。
 * 残り時間は「終わる時刻」から毎回計算する（タイマーの積み上げだと、裏に回ったときにずれるため）。
 */
export const WorkoutScreen = ({ items, onFinish, onQuit }: Props) => {
  const phases = useMemo(() => buildPhases(items.length), [items.length])
  const [idx, setIdx] = useState(0)
  const [endAt, setEndAt] = useState(() => Date.now() + phases[0].sec * 1000)
  const [pausedLeft, setPausedLeft] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [voiceOn, setVoiceOn] = useState(true)
  const [musicOn, setMusicOn] = useState(isMusicEnabled)
  const said = useRef<Set<string>>(new Set())
  const finished = useRef(false)

  const phase = phases[idx]
  const item = items[phase.i]
  const leftMs = pausedLeft ?? Math.max(0, endAt - now)
  const left = Math.ceil(leftMs / 1000)

  useEffect(() => {
    let release = () => {}
    void keepAwake().then((r) => (release = r))
    return () => release()
  }, [])

  useEffect(() => {
    if (pausedLeft !== null) return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [pausedLeft])

  /** 同じきっかけで2回鳴らさない（画面は0.2秒ごとに描き直すため） */
  const once = (key: string, fn: () => void) => {
    if (said.current.has(key)) return
    said.current.add(key)
    fn()
  }
  const sayOnce = (key: string, text: string) => once(key, () => speak(text))

  useEffect(() => () => stopMusic(), [])

  // フェーズの切り替え、音楽、読み上げ、カウントダウン
  useEffect(() => {
    if (pausedLeft !== null) return
    playMusic(phase.kind === 'work' ? 'work' : 'rest')
    if (phase.kind === 'ready') sayOnce(`ready`, `1種目めは、${item.name}。準備して`)
    if (phase.kind === 'work') {
      sayOnce(`w${idx}`, `${item.name}、スタート！`)
      if (item.switchSides && left === WORK_SEC / 2) sayOnce(`s${idx}`, '反対側！')
      if (left === 3) sayOnce(`c${idx}`, 'あと3秒！')
    }
    if (phase.kind === 'rest') sayOnce(`r${idx}`, `休憩。次は、${item.name}`)
    // 休憩・準備の残り5秒から「ピッ」
    if (phase.kind !== 'work' && left >= 1 && left <= COUNTDOWN_SEC) once(`b${idx}-${left}`, beep)

    if (leftMs > 0) return
    if (idx === phases.length - 1) {
      if (finished.current) return
      finished.current = true
      stopMusic()
      fanfare()
      speak('おつかれさま！')
      onFinish()
      return
    }
    const next = idx + 1
    if (phases[next].kind === 'work') go()
    setIdx(next)
    setEndAt(Date.now() + phases[next].sec * 1000)
  }, [now, idx, pausedLeft])

  const togglePause = () => {
    if (pausedLeft === null) {
      setPausedLeft(Math.max(0, endAt - Date.now()))
      speechSynthesis?.cancel()
      stopMusic()
    } else {
      setEndAt(Date.now() + pausedLeft)
      setPausedLeft(null)
    }
  }

  const toggleVoice = () => {
    setVoiceOn((v) => {
      setSpeechEnabled(!v)
      return !v
    })
  }

  const toggleMusic = () => {
    const on = !musicOn
    setMusicOn(on)
    setMusicEnabled(on)
    if (on && pausedLeft === null) playMusic(phase.kind === 'work' ? 'work' : 'rest')
  }

  const quit = () => {
    if (confirm('運行をやめますか？（途中でやめると、サイコロは振れません）')) {
      speechSynthesis?.cancel()
      stopMusic()
      onQuit()
    }
  }

  const doneCount = phase.i
  const heading = phase.kind === 'ready' ? '準備' : phase.kind === 'rest' ? '休憩' : item.name

  return (
    <div className="screen sea screen--center">
      <div className="win" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
          <span>
            運行状況　{Math.min(phase.i + 1, items.length)} / {items.length} 駅
          </span>
          <span style={{ display: 'flex', gap: 12 }}>
            <button className="link-btn" style={{ minHeight: 0, padding: 0, fontSize: 12 }} onClick={toggleMusic}>
              音楽 {musicOn ? 'ON' : 'OFF'}
            </button>
            <button className="link-btn" style={{ minHeight: 0, padding: 0, fontSize: 12 }} onClick={toggleVoice}>
              音声 {voiceOn ? 'ON' : 'OFF'}
            </button>
          </span>
        </div>
        <svg viewBox="0 0 340 30" style={{ width: '100%' }} aria-hidden>
          <line x1="20" y1="15" x2="320" y2="15" stroke="#1e2230" strokeWidth="9" strokeLinecap="round" />
          <line x1="20" y1="15" x2="320" y2="15" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          {items.map((_, i) => {
            const x = 8 + (i * 300) / Math.max(items.length - 1, 1)
            const fill = i < doneCount ? '#d93a2f' : i === phase.i && phase.kind === 'work' ? '#ffd23f' : '#fff'
            return <rect key={i} x={x} y={3} width={24} height={24} rx={3} fill={fill} stroke="#1e2230" strokeWidth={2.5} />
          })}
        </svg>
      </div>

      <h1 className={`title3d${phase.kind === 'work' ? '' : ' title3d--white'}`} style={{ fontSize: phase.kind === 'work' ? 34 : 30 }}>
        {heading}
      </h1>
      {phase.kind !== 'work' && (
        <p style={{ margin: 0, fontWeight: 800 }}>
          次は <span className="hl">{item.name}</span>
        </p>
      )}

      <div className="figure">
        <StickFigure poses={item.poses} paused={phase.kind !== 'work' || pausedLeft !== null} />
      </div>

      <p style={{ margin: 0, fontWeight: 800, fontSize: 14, textAlign: 'center' }}>{item.point}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="big-num" style={{ fontSize: 80 }}>
          {left}
        </span>
        <span className="big-num" style={{ fontSize: 22 }}>
          秒
        </span>
      </div>

      <div className="grow" />
      <div style={{ display: 'flex', gap: 12, alignSelf: 'stretch' }}>
        <button className="btn btn--yellow" onClick={togglePause}>
          {pausedLeft === null ? 'いったん停車' : '運転再開'}
        </button>
        <button className="btn btn--navy" style={{ width: 120, fontSize: 16 }} onClick={quit}>
          やめる
        </button>
      </div>
    </div>
  )
}
