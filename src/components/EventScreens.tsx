import { useEffect, useRef, useState } from 'react'
import { CHALLENGE_BY_ID } from '../data/exercises'
import { MAP_LENGTH, MAPS } from '../data/maps'
import { keepAwake, speak } from '../lib/speech'
import { completeChallenge } from '../lib/store'
import type { AdvanceResult, MainDoc, RewardKind } from '../types'
import { MapView } from './MapView'
import { IMG, StickFigure, Talk } from './parts'

const REWARD_TEXT: Record<RewardKind, { name: string; desc: string; line: string }> = {
  reroll: { name: 'ふりなおしカード', desc: 'サイコロを1回だけ振りなおせる', line: 'ふりなおしカード を あげる！' },
  plusOne: { name: '+1カード', desc: '次にサイコロを振ったとき、1マス多く進む', line: '次のサイコロが +1 になるよ！' },
  advance3: { name: '3マス進む', desc: 'その場で3マス進んだ', line: 'おまけに 3マス 進んじゃおう！' },
}

/** 普通のマスと駅：進んだ結果をマップで見せる */
export const ArriveScreen = ({ main, result, onOk }: { main: MainDoc; result: AdvanceResult; onOk: () => void }) => (
  <div className="screen sea">
    <h1 className="title3d" style={{ fontSize: 30 }}>
      {result.total}マス進んだ！
    </h1>
    <MapView mapIndex={main.mapIndex} position={result.to} />
    {result.station ? (
      <Talk name="アナウンス">
        まもなく <span className="hl">{result.station.name}</span>、{result.station.name}。
        <br />
        {result.station.note}
      </Talk>
    ) : (
      <Talk name="アナウンス">
        {result.from} → <span className="hl">{result.to}</span>マス目に到着。
        <br />
        次の駅まで、もうすこし！
      </Talk>
    )}
    <div className="grow" />
    <button className="btn" onClick={onOk}>
      OK
    </button>
  </div>
)

/** ご褒美マス：しゅりまるが跳ねて登場 */
export const RewardScreen = ({ result, onOk }: { result: AdvanceResult; onOk: () => void }) => {
  const r = REWARD_TEXT[result.reward ?? 'reroll']
  useEffect(() => speak('ご褒美マス！'), [])
  return (
    <div className="screen dots-blue screen--center">
      <h1 className="title3d title3d--white" style={{ fontSize: 36, marginTop: 16 }}>
        ご褒美マス！
      </h1>
      <div className="shuri-stage popin">
        <div className="shuri-stage__circle" />
        <img src={IMG.full} alt="しゅりまる" />
      </div>
      <Talk>
        ご褒美マスだよ〜！
        <br />
        <span className="hl">{r.line}</span>
      </Talk>
      <div className="card">
        <span className="card__label">CARD</span>
        <span className="card__name">{r.name}</span>
        <span style={{ fontSize: 11 }}>{r.desc}</span>
      </div>
      <div className="grow" />
      <button className="btn" onClick={onOk}>
        受け取る
      </button>
    </div>
  )
}

/** チャレンジマス：おまけ運動の提案 */
export const ChallengeScreen = ({ result, onDo, onPass }: { result: AdvanceResult; onDo: () => void; onPass: () => void }) => {
  const c = CHALLENGE_BY_ID[result.challengeId ?? 'plank30']
  const [cursor, setCursor] = useState<0 | 1>(0)
  useEffect(() => speak(`チャレンジマス！${c.name}、やってみる？`), [c.name])
  return (
    <div className="screen dots-yellow screen--center">
      <h1 className="title3d title3d--white" style={{ fontSize: 34, marginTop: 16 }}>
        チャレンジマス！
      </h1>
      <div className="frame popin" style={{ width: 210, height: 250, position: 'relative' }}>
        <img src={IMG.point} alt="しゅりまる" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <Talk>
        <span className="hl">{c.name}</span>、やってみる？
        <br />
        成功したら サイコロもう1回！
      </Talk>
      <div className="win choices">
        <button className={`choice${cursor === 0 ? ' choice--active' : ''}`} onFocus={() => setCursor(0)} onMouseEnter={() => setCursor(0)} onClick={onDo}>
          やる！
        </button>
        <button className={`choice${cursor === 1 ? ' choice--active' : ''}`} onFocus={() => setCursor(1)} onMouseEnter={() => setCursor(1)} onClick={onPass}>
          今日はパス<span className="choice__note">（損はしないよ）</span>
        </button>
      </div>
    </div>
  )
}

/** チャレンジの実行（タイマー） */
export const ChallengeRunScreen = ({ uid, result, onDone, onQuit }: { uid: string; result: AdvanceResult; onDone: () => void; onQuit: () => void }) => {
  const c = CHALLENGE_BY_ID[result.challengeId ?? 'plank30']
  const [endAt] = useState(() => Date.now() + (c.seconds + 3) * 1000)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const sent = useRef(false)
  const left = Math.max(0, Math.ceil((endAt - now) / 1000))
  const started = left <= c.seconds

  useEffect(() => {
    let release = () => {}
    void keepAwake().then((r) => (release = r))
    speak(`${c.name}。3秒後にスタート`)
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => {
      clearInterval(t)
      release()
    }
  }, [c.name])

  useEffect(() => {
    if (left === c.seconds) speak('スタート！')
    if (left === 3 && started) speak('あと3秒！')
    if (left === 0 && !sent.current) {
      sent.current = true
      speak('チャレンジ成功！')
      completeChallenge(uid).then(onDone, (e) => setError(e instanceof Error ? e.message : String(e)))
    }
  }, [left, started, c.seconds, uid, onDone])

  return (
    <div className="screen dots-yellow screen--center">
      <span className="chip">チャレンジ</span>
      <h1 className="title3d title3d--white" style={{ fontSize: 30 }}>
        {c.name}
      </h1>
      <div className="figure">
        <StickFigure poses={c.poses} paused={!started} />
      </div>
      <p style={{ margin: 0, fontWeight: 800 }}>{c.point}</p>
      <span className="big-num" style={{ fontSize: 80 }}>
        {started ? left : left - c.seconds}
      </span>
      <span style={{ fontWeight: 800 }}>{started ? '秒' : 'スタートまで'}</span>
      {error && <p className="error">{error}</p>}
      <div className="grow" />
      <button className="btn btn--navy btn--small" onClick={onQuit}>
        やめる（サイコロはなし）
      </button>
    </div>
  )
}

/** ゴール */
export const GoalScreen = ({ main, onNext }: { main: MainDoc; onNext: () => void }) => {
  useEffect(() => speak('ゴール！おめでとう！'), [])
  return (
    <div className="screen bg-red screen--center">
      <span className="chip">
        マップ{main.mapIndex + 1}　{MAPS[main.mapIndex].title}
      </span>
      <h1 className="title3d" style={{ fontSize: 50 }}>
        {MAPS[main.mapIndex].to}
        <br />
        到着！
      </h1>
      <div className="frame popin" style={{ width: '100%', maxWidth: 360 }}>
        <img src={IMG.family} alt="家族3人とお城" style={{ width: '100%', display: 'block' }} />
      </div>
      <Talk>
        {MAP_LENGTH}マス、とうちゃく！
        <br />
        ご褒美は… <span className="hl">{main.mapReward || '（まだ決めていなかったね）'}</span>！
      </Talk>
      <div className="grow" />
      <button className="btn btn--yellow" onClick={onNext}>
        次の目的地へ
      </button>
    </div>
  )
}
