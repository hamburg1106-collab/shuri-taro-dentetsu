/**
 * 日付はすべて日本時間で扱う。1日の区切りは夜0時（2026-09-25 決定）。
 * 端末の時刻設定がずれていても、夫婦で「今日」が食い違わないようにするため。
 */
const fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })

/** YYYY-MM-DD */
export const dateKey = (d: Date = new Date()): string => fmt.format(d)

/** YYYY-MM-DD を正午のDateにする（日付の計算用。時差で日がずれないよう正午にする） */
const parse = (key: string): Date => new Date(`${key}T12:00:00+09:00`)

export const addDays = (key: string, n: number): string => {
  const d = parse(key)
  d.setUTCDate(d.getUTCDate() + n)
  return dateKey(d)
}

/** 0=日, 1=月 … 6=土 */
export const weekday = (key: string): number => {
  const d = parse(key)
  return new Date(d.getTime() + 9 * 3600_000).getUTCDay()
}

const WD = ['日', '月', '火', '水', '木', '金', '土']

/** 9/25（金） */
export const label = (key: string): string => {
  const [, m, d] = key.split('-').map(Number)
  return `${m}/${d}（${WD[weekday(key)]}）`
}

/** その週の月曜 */
export const mondayOf = (key: string): string => {
  const w = weekday(key)
  return addDays(key, w === 0 ? -6 : 1 - w)
}

/** 週の名前（その週の月曜の日付）。MVPを見たかどうかの記録に使う */
export const weekKey = (key: string): string => mondayOf(key)

/** 先週の月曜〜日曜 */
export const lastWeekDays = (today: string): string[] => {
  const mon = addDays(mondayOf(today), -7)
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i))
}
