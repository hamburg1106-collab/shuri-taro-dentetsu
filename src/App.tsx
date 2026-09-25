import type { User } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { ArriveScreen, ChallengeRunScreen, ChallengeScreen, GoalScreen, RewardScreen } from './components/EventScreens'
import { DiceScreen } from './components/DiceScreen'
import { HomeScreen } from './components/HomeScreen'
import { LoginGate } from './components/LoginGate'
import { MenuScreen } from './components/MenuScreen'
import { MvpScreen, lastWeekScores } from './components/MvpScreen'
import { Logo, Talk } from './components/parts'
import { RewardSetup } from './components/RewardSetup'
import { RolePick } from './components/RolePick'
import { SettingsScreen } from './components/SettingsScreen'
import { WeightScreen } from './components/WeightScreen'
import { WorkoutScreen, type WorkItem } from './components/WorkoutScreen'
import { resolve } from './data/exercises'
import { logout, watchUser } from './lib/auth'
import { addDays, dateKey, weekKey } from './lib/date'
import { menuOf } from './lib/menu'
import { unlockSpeech } from './lib/speech'
import { completeWorkout, markMvpSeen, watchDays, watchMain, watchWeights } from './lib/store'
import { holdUpdate } from './lib/swUpdate'
import { EMPTY_DAY, type AdvanceResult, type DayDoc, type MainDoc, type Weight } from './types'

type Screen =
  | { name: 'home' }
  | { name: 'menu' }
  | { name: 'workout' }
  | { name: 'dice' }
  | { name: 'arrive'; result: AdvanceResult }
  | { name: 'reward'; result: AdvanceResult }
  | { name: 'challenge'; result: AdvanceResult }
  | { name: 'challengeRun'; result: AdvanceResult }
  | { name: 'goal' }
  | { name: 'rewardSetup'; mode: 'current' | 'next' }
  | { name: 'mvp' }
  | { name: 'weight' }
  | { name: 'settings' }

/** 日付が変わったのに気づけるよう、画面に戻るたびと1分ごとに「今日」を取り直す */
const useToday = (): string => {
  const [key, setKey] = useState(dateKey())
  useEffect(() => {
    const update = () => setKey(dateKey())
    const t = setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return key
}

const Loading = () => (
  <div className="gate sea">
    <Logo />
    <p>読み込み中…</p>
  </div>
)

const Signed = ({ user }: { user: User }) => {
  const uid = user.uid
  const todayKey = useToday()
  const [main, setMain] = useState<MainDoc | null>(null)
  const [denied, setDenied] = useState(false)
  const [days, setDays] = useState<Record<string, DayDoc>>({})
  const [weights, setWeights] = useState<Weight[]>([])
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [error, setError] = useState<string | null>(null)
  const [mvpChecked, setMvpChecked] = useState(false)

  useEffect(
    () =>
      watchMain(setMain, (e) => {
        if ((e as { code?: string }).code === 'permission-denied') setDenied(true)
        else setError(e.message)
      }),
    [],
  )
  const from = addDays(todayKey, -14)
  useEffect(() => watchDays(from, setDays), [from])
  useEffect(() => watchWeights(setWeights), [])

  // 運動中・チャレンジ中は、アプリの更新で画面を読み込み直さない
  useEffect(() => holdUpdate(screen.name === 'workout' || screen.name === 'challengeRun'), [screen.name])

  const me = main?.members[uid]
  const levels = me?.levels ?? {}
  const menu = useMemo(() => menuOf(todayKey), [todayKey])
  const items: WorkItem[] = useMemo(
    () => menu.map((ex) => ({ ...resolve(ex, levels[ex.id] ?? 'normal'), switchSides: ex.switchSides })),
    [menu, levels],
  )
  const scores = useMemo(() => (main ? lastWeekScores(main, days, todayKey) : []), [main, days, todayKey])

  // 週が変わって最初に開いたとき、先週の決算を1回だけ見せる
  useEffect(() => {
    if (!main || !me || mvpChecked) return
    setMvpChecked(true)
    const seen = main.mvpSeen[uid] === weekKey(todayKey)
    if (!seen && scores.some((s) => s.total > 0) && screen.name === 'home') setScreen({ name: 'mvp' })
  }, [main, me, mvpChecked, scores, uid, todayKey, screen.name])

  if (denied) {
    return (
      <div className="gate sea">
        <Logo />
        <Talk>
          このアカウントは、まだ乗車登録されていません。
          <br />
          IDを敏さんに送ってね
        </Talk>
        <p style={{ wordBreak: 'break-all', fontSize: 12 }}>ID: {uid}</p>
        <button className="btn btn--navy" onClick={() => void navigator.clipboard?.writeText(uid)}>
          IDをコピー
        </button>
        <button className="link-btn" onClick={() => void logout()}>
          ログアウト
        </button>
      </div>
    )
  }
  if (!main) return <Loading />
  if (!me) return <RolePick uid={uid} main={main} />

  const home = () => setScreen({ name: 'home' })
  const today = days[todayKey] ?? EMPTY_DAY

  const afterMove = (r: AdvanceResult) => {
    if (r.goal) setScreen({ name: 'goal' })
    else if (r.reward) setScreen({ name: 'reward', result: r })
    else if (r.challengeId) setScreen({ name: 'challenge', result: r })
    else setScreen({ name: 'arrive', result: r })
  }

  const finishWorkout = async () => {
    try {
      const dice = await completeWorkout(uid)
      setScreen(dice ? { name: 'dice' } : { name: 'home' })
      if (!dice) setError('今日の分はもう記録されていました')
    } catch (e) {
      setError(`記録できませんでした（${e instanceof Error ? e.message : String(e)}）。電波のよいところで開き直してください`)
      home()
    }
  }

  const view = (() => {
    switch (screen.name) {
      case 'home':
        return (
          <HomeScreen
            uid={uid}
            main={main}
            today={today}
            todayKey={todayKey}
            onStart={() => setScreen({ name: 'menu' })}
            onDice={() => setScreen({ name: 'dice' })}
            onGoal={() => setScreen({ name: 'goal' })}
            onReward={() => setScreen({ name: 'rewardSetup', mode: 'current' })}
            onWeight={() => setScreen({ name: 'weight' })}
            onMvp={() => setScreen({ name: 'mvp' })}
            onSettings={() => setScreen({ name: 'settings' })}
          />
        )
      case 'menu':
        return (
          <MenuScreen
            uid={uid}
            todayKey={todayKey}
            menu={menu}
            levels={levels}
            onBack={home}
            onGo={() => {
              unlockSpeech()
              setScreen({ name: 'workout' })
            }}
          />
        )
      case 'workout':
        return <WorkoutScreen items={items} onFinish={() => void finishWorkout()} onQuit={home} />
      case 'dice':
        return <DiceScreen uid={uid} main={main} onMoved={afterMove} onBack={home} />
      case 'arrive':
        return <ArriveScreen main={main} result={screen.result} onOk={home} />
      case 'reward':
        return <RewardScreen result={screen.result} onOk={home} />
      case 'challenge':
        return (
          <ChallengeScreen
            result={screen.result}
            onDo={() => {
              unlockSpeech()
              setScreen({ name: 'challengeRun', result: screen.result })
            }}
            onPass={home}
          />
        )
      case 'challengeRun':
        return <ChallengeRunScreen uid={uid} result={screen.result} onDone={() => setScreen({ name: 'dice' })} onQuit={home} />
      case 'goal':
        return <GoalScreen main={main} onNext={() => setScreen({ name: 'rewardSetup', mode: 'next' })} />
      case 'rewardSetup':
        return <RewardSetup main={main} mode={screen.mode} onDone={home} onBack={home} />
      case 'mvp':
        return (
          <MvpScreen
            main={main}
            scores={scores}
            todayKey={todayKey}
            onClose={() => {
              void markMvpSeen(uid, weekKey(todayKey))
              home()
            }}
          />
        )
      case 'weight':
        return <WeightScreen uid={uid} main={main} weights={weights} onBack={home} />
      case 'settings':
        return <SettingsScreen uid={uid} main={main} onBack={home} />
    }
  })()

  return (
    <>
      {view}
      {error && (
        <div style={{ position: 'fixed', left: 12, right: 12, bottom: 'calc(env(safe-area-inset-bottom) + 12px)', zIndex: 10 }}>
          <button className="error" style={{ width: '100%', border: 'none', textAlign: 'left' }} onClick={() => setError(null)}>
            {error}（タップで閉じる）
          </button>
        </div>
      )}
    </>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => watchUser(setUser), [])
  if (user === undefined) return <Loading />
  if (!user) return <LoginGate />
  return <Signed key={user.uid} user={user} />
}
