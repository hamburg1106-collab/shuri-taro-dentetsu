import { POINT_PER_CHALLENGE, POINT_PER_DAY, ROLE_NAME } from '../config'
import { label, lastWeekDays } from '../lib/date'
import { rng } from '../lib/random'
import type { DayDoc, MainDoc } from '../types'
import { IMG, Talk } from './parts'

const TITLES = ['脂肪燃焼王', '汗かき大臣', '腹筋大将', '筋肉駅長', 'スクワット名人', '皆勤運転士', 'サイコロ番長', '体幹の鉄人']

export type Score = { uid: string; days: number; challenges: number; total: number }

/** 先週（月〜日）のポイント。運動した日 10pt、チャレンジ成功 3pt */
export const lastWeekScores = (main: MainDoc, days: Record<string, DayDoc>, todayKey: string): Score[] =>
  Object.keys(main.members).map((uid) => {
    let d = 0
    let c = 0
    for (const key of lastWeekDays(todayKey)) {
      const day = days[key]
      if (!day) continue
      if (day.done[uid]) d++
      c += day.challenges[uid] ?? 0
    }
    return { uid, days: d, challenges: c, total: d * POINT_PER_DAY + c * POINT_PER_CHALLENGE }
  })

export const MvpScreen = ({ main, scores, todayKey, onClose }: { main: MainDoc; scores: Score[]; todayKey: string; onClose: () => void }) => {
  const week = lastWeekDays(todayKey)
  const sorted = [...scores].sort((a, b) => b.total - a.total)
  const top = sorted[0]?.total ?? 0
  const winners = sorted.filter((s) => s.total === top && top > 0)
  const title = TITLES[Math.floor(rng(`title:${week[0]}`)() * TITLES.length)]
  const name = (uid: string) => ROLE_NAME[main.members[uid]?.role ?? 'danna']

  return (
    <div className="screen sea screen--center">
      <span className="chip">
        先週 {label(week[0])}〜{label(week[6])}
      </span>
      <h1 className="title3d" style={{ fontSize: 34 }}>
        今週の決算！
      </h1>
      <div className="frame popin" style={{ width: '100%', maxWidth: 360 }}>
        <img src={IMG.mic} alt="マイクを前にしたしゅりまる" style={{ width: '100%', display: 'block' }} />
      </div>
      <Talk>
        {winners.length === 0 ? (
          <>先週は運行がなかったみたい…今週はがんばろう！</>
        ) : winners.length > 1 ? (
          <>
            先週は <span className="hl">2人とも同点</span>！
            <br />
            ふたりそろって「<span className="hl">{title}</span>」！
          </>
        ) : (
          <>
            今週のMVPは… <span className="hl">{name(winners[0].uid)}</span>！
            <br />
            称号「<span className="hl">{title}</span>」をさずけます！
          </>
        )}
      </Talk>
      <div className="win">
        {sorted.map((s, i) => (
          <div className="rank" key={s.uid}>
            <span className="rank__place" style={{ background: i === 0 && top > 0 ? 'var(--yellow)' : 'var(--sub)' }}>
              {sorted.findIndex((x) => x.total === s.total) + 1}位
            </span>
            <span className="grow" style={{ fontSize: 16 }}>
              {name(s.uid)}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {s.days}日＋チャレンジ{s.challenges}回
            </span>
            <span className={i === 0 && top > 0 ? 'hl' : ''} style={{ fontSize: 18 }}>
              {s.total}pt
            </span>
          </div>
        ))}
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
          運動した日 {POINT_PER_DAY}pt、チャレンジ成功 {POINT_PER_CHALLENGE}pt。称号だけで、ゲームの有利・不利はありません
        </div>
      </div>
      <div className="grow" />
      <button className="btn" onClick={onClose}>
        今週も出発進行！
      </button>
    </div>
  )
}
