import { rng } from '../lib/random'

export const MAP_LENGTH = 250

export type Station = { at: number; name: string; note: string }

export type GameMap = { id: string; title: string; from: string; to: string; stations: Station[] }

/**
 * マップ3枚。1マップ250マスで、2人とも毎日やるとおよそ1ヶ月でゴールする。
 * 駅は10〜20マスごと。着いたら note を表示する。
 */
export const MAPS: GameMap[] = [
  {
    id: 'map1',
    title: '鶴川 → 大阪',
    from: '鶴川',
    to: '大阪',
    stations: [
      { at: 0, name: '鶴川', note: 'しゅり太郎電鉄の始発駅。出発進行！' },
      { at: 12, name: '町田', note: '小田急とJRが交わる、にぎやかな街' },
      { at: 30, name: '本厚木', note: '夏は「あつぎ鮎まつり」の花火' },
      { at: 45, name: '秦野', note: '丹沢のふもと。名水の里' },
      { at: 60, name: '小田原', note: '小田原城と、かまぼこの街' },
      { at: 75, name: '箱根', note: '温泉と芦ノ湖。坂道でひと汗' },
      { at: 90, name: '熱海', note: '海と温泉の街' },
      { at: 105, name: '三島', note: '富士山の湧き水と、うなぎ' },
      { at: 125, name: '静岡', note: 'お茶の産地。富士山がきれい' },
      { at: 150, name: '浜松', note: 'うなぎと、楽器の街' },
      { at: 165, name: '豊橋', note: 'ちくわが名物' },
      { at: 190, name: '名古屋', note: '味噌カツ、ひつまぶし、手羽先' },
      { at: 210, name: '関ヶ原', note: '天下分け目の合戦の地' },
      { at: 230, name: '京都', note: '千年の都。お寺めぐり' },
      { at: 250, name: '大阪', note: 'くいだおれの街に到着！' },
    ],
  },
  {
    id: 'map2',
    title: '大阪 → 鳴門',
    from: '大阪',
    to: '鳴門',
    stations: [
      { at: 0, name: '大阪', note: '次の目的地は鳴門。出発進行！' },
      { at: 20, name: '西宮', note: '高校野球の聖地、甲子園' },
      { at: 45, name: '神戸', note: '港町。南京町の中華街' },
      { at: 70, name: '須磨', note: '海水浴と水族館' },
      { at: 90, name: '明石', note: '明石焼と、明石海峡大橋' },
      { at: 110, name: '淡路島', note: '橋を渡って島に上陸！' },
      { at: 135, name: '淡路夢舞台', note: '花と緑の島' },
      { at: 160, name: '洲本', note: '洲本城と温泉' },
      { at: 190, name: '南あわじ', note: '玉ねぎの産地' },
      { at: 215, name: '福良', note: 'うずしおを間近で見られる港' },
      { at: 235, name: '大鳴門橋', note: '橋の下はうずしお' },
      { at: 250, name: '鳴門', note: 'うずしおの街に到着！' },
    ],
  },
  {
    id: 'map3',
    title: '四国一周',
    from: '鳴門',
    to: '鳴門',
    stations: [
      { at: 0, name: '鳴門', note: '四国をぐるっと一周。出発進行！' },
      { at: 25, name: '徳島', note: '阿波おどりの街' },
      { at: 55, name: '日和佐', note: 'ウミガメが来る浜' },
      { at: 80, name: '室戸岬', note: '太平洋に突き出た岬' },
      { at: 105, name: '高知', note: 'かつおのたたき、はりまや橋' },
      { at: 135, name: '四万十', note: '日本最後の清流' },
      { at: 155, name: '足摺岬', note: '四国の最南端' },
      { at: 175, name: '宇和島', note: '鯛めしが名物' },
      { at: 200, name: '松山', note: '道後温泉でひと休み' },
      { at: 215, name: '今治', note: 'タオルと焼き鳥の街' },
      { at: 235, name: '高松', note: 'さぬきうどん' },
      { at: 250, name: '鳴門', note: '四国一周、達成！' },
    ],
  },
]

export type SquareKind = 'normal' | 'reward' | 'challenge' | 'station'

/**
 * マスの種類。マップごとに決まった並び（毎回同じ）になるよう、マップIDを種にする。
 * ご褒美 約12%、チャレンジ 約8%。駅の上と、スタート直後の3マスには置かない。
 */
export const squaresOf = (map: GameMap): SquareKind[] => {
  const r = rng(`squares:${map.id}`)
  const stationAt = new Set(map.stations.map((s) => s.at))
  const out: SquareKind[] = []
  for (let i = 0; i <= MAP_LENGTH; i++) {
    if (stationAt.has(i)) {
      out.push('station')
      continue
    }
    const x = r()
    if (i <= 3) out.push('normal')
    else if (x < 0.12) out.push('reward')
    else if (x < 0.2) out.push('challenge')
    else out.push('normal')
  }
  return out
}

const cache = new Map<string, SquareKind[]>()
export const squareKind = (mapIndex: number, at: number): SquareKind => {
  const map = MAPS[mapIndex]
  let s = cache.get(map.id)
  if (!s) {
    s = squaresOf(map)
    cache.set(map.id, s)
  }
  return s[Math.min(at, MAP_LENGTH)]
}

export const stationAt = (mapIndex: number, at: number): Station | undefined =>
  MAPS[mapIndex].stations.find((s) => s.at === at)

/** いまの位置から見て、次の駅 */
export const nextStation = (mapIndex: number, at: number): Station =>
  MAPS[mapIndex].stations.find((s) => s.at > at) ?? MAPS[mapIndex].stations[MAPS[mapIndex].stations.length - 1]
