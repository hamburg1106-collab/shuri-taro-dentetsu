import { DAY_THEMES, READY_SEC, REST_SEC, WORK_SEC } from '../config'
import { resolve, videoUrl, type Exercise, type Level } from '../data/exercises'
import { label, weekday } from '../lib/date'
import { themeOf } from '../lib/menu'
import { setLevel } from '../lib/store'
import { Back } from './parts'

type Props = {
  uid: string
  todayKey: string
  /** 今日の何本目か */
  round: number
  menu: Exercise[]
  levels: Record<string, Level>
  onBack: () => void
  onGo: () => void
}

const WD = ['日', '月', '火', '水', '木', '金', '土']

export const MenuScreen = ({ uid, todayKey, round, menu, levels, onBack, onGo }: Props) => {
  const today = weekday(todayKey)
  const total = READY_SEC + menu.length * WORK_SEC + (menu.length - 1) * REST_SEC
  return (
    <div className="screen sea">
      <Back onClick={onBack} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span className="chip">
          {label(todayKey)} 本日の運行{round > 1 && `（${round}本目・サイコロなし）`}
        </span>
        <h1 className="title3d" style={{ fontSize: 38 }}>
          {themeOf(todayKey).name}
        </h1>
      </div>

      <div className="week">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className={`week__day${d === today ? ' week__day--today' : ''}`}>
            {WD[d]}
            <small>{DAY_THEMES[d].short}</small>
          </div>
        ))}
      </div>

      <div className="win" style={{ padding: '4px 12px' }}>
        {menu.map((ex, i) => {
          const lv = levels[ex.id] ?? 'normal'
          const v = resolve(ex, lv)
          return (
            <div className="item" key={ex.id}>
              <span className="station-no">{i + 1}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <span className="item__name">{v.name}</span>
                  {v.hasLevels && (
                    <button
                      className="level"
                      onClick={() => void setLevel(uid, ex.id, lv === 'easy' ? 'normal' : 'easy')}
                      aria-label={`強さを変える（いまは${lv === 'easy' ? 'やさしい' : 'ふつう'}）`}
                    >
                      {lv === 'easy' ? 'やさしい' : 'ふつう'} ⇄
                    </button>
                  )}
                </div>
                <span className="item__point">{v.point}</span>
                <a href={videoUrl(v.name)} target="_blank" rel="noreferrer">
                  ▶ やり方を動画で見る
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>
        {WORK_SEC}秒運動 ＋ {REST_SEC}秒休憩 × {menu.length}種目（約{Math.round(total / 60)}分）
        <br />
        <span className="muted">「やさしい⇄ふつう」を押すと強さが変わります</span>
      </p>

      <div className="grow" />
      <button className="btn" onClick={onGo}>
        出発進行！
      </button>
    </div>
  )
}
