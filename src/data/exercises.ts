import type { PoseName } from './poses'

export type Tag = 'lower' | 'upper' | 'core' | 'cardio' | 'gentle'
export type Level = 'easy' | 'normal'

type Variant = { name: string; point: string; poses: PoseName[] }

export type Exercise = {
  id: string
  name: string
  point: string
  tags: Tag[]
  poses: PoseName[]
  /** 強さを選べる種目。easy がやさしい版 */
  easy?: Variant
  /** 40秒の途中（20秒）で左右を入れ替える */
  switchSides?: boolean
}

/**
 * 種目の一覧。
 *
 * 腰や膝への負担が大きいもの（ジャンプランジ、Vシットなど）は入れていない。
 * ジャンプ系は入れる（2026-09-25 決定）。
 */
export const EXERCISES: Exercise[] = [
  // ---- 下半身 ----
  { id: 'squat', name: 'スクワット', point: '膝がつま先より前に出ないように', tags: ['lower'], poses: ['standSideFwd', 'squatSide'] },
  { id: 'wideSquat', name: 'ワイドスクワット', point: '足を大きく開き、つま先は外向き', tags: ['lower'], poses: ['wideStand', 'wideSquat'] },
  { id: 'backLunge', name: 'バックランジ', point: '片脚ずつ後ろへ。上半身はまっすぐ', tags: ['lower'], poses: ['standSide', 'lungeBack'] },
  { id: 'sideLunge', name: 'サイドランジ', point: '横に踏み出して、お尻を引く。左右交互', tags: ['lower'], poses: ['sideLungeL', 'wideStand', 'sideLungeR', 'wideStand'] },
  { id: 'calfRaise', name: 'カーフレイズ', point: 'かかとを上げて、ゆっくり下ろす', tags: ['lower', 'gentle'], poses: ['stand', 'calfUp'] },
  { id: 'hipLift', name: 'ヒップリフト', point: '肩からひざまで一直線になるまで上げる', tags: ['lower', 'core', 'gentle'], poses: ['bridgeDown', 'bridgeUp'] },
  { id: 'donkeyKick', name: 'ドンキーキック', point: '足の裏で天井を押すように。20秒で左右交代', tags: ['lower'], poses: ['allFours', 'donkeyUp'], switchSides: true },
  {
    id: 'squatJump',
    name: 'スクワットジャンプ',
    point: 'しゃがんで、真上に跳ぶ。着地はやわらかく',
    tags: ['lower', 'cardio'],
    poses: ['squatFront', 'armsUpJump'],
    easy: { name: 'スクワット（はやめ）', point: '跳ばずに、テンポよくしゃがむ', poses: ['stand', 'squatFront'] },
  },

  // ---- 上半身 ----
  {
    id: 'pushup',
    name: '腕立て伏せ',
    point: '頭からかかとまで一直線',
    tags: ['upper'],
    poses: ['pushUp', 'pushDown'],
    easy: { name: '膝つき腕立て', point: '膝をついて、頭から膝まで一直線', poses: ['kneePushUp', 'kneePushDown'] },
  },
  {
    id: 'widePushup',
    name: 'ワイド腕立て',
    point: '手を肩幅より広くつく',
    tags: ['upper'],
    poses: ['pushUp', 'pushDown'],
    easy: { name: '膝つきワイド腕立て', point: '膝をついて、手は肩幅より広く', poses: ['kneePushUp', 'kneePushDown'] },
  },
  { id: 'pike', name: 'パイクプッシュアップ', point: 'お尻を高く上げ、頭を床に近づける', tags: ['upper'], poses: ['pikeUp', 'pikeDown'] },
  { id: 'dip', name: 'リバースプッシュアップ', point: '後ろに手をついて、ひじを曲げ伸ばし', tags: ['upper'], poses: ['dipUp', 'dipDown'] },
  { id: 'shoulderTap', name: 'ショルダータップ', point: '腕立ての姿勢で、反対の肩を交互にタッチ', tags: ['upper', 'core'], poses: ['pushUp', 'shoulderTap'] },
  { id: 'plankUpDown', name: 'プランクアップダウン', point: 'ひじつき→手のひら→ひじつき、を繰り返す', tags: ['upper', 'core'], poses: ['plankElbow', 'pushUp'] },
  { id: 'superman', name: 'スーパーマン', point: 'うつぶせで、手足を同時に浮かせる', tags: ['upper', 'core'], poses: ['proneFlat', 'proneLift'] },
  { id: 'armCircle', name: 'アームサークル', point: '腕を横に伸ばして、小さく回す', tags: ['upper', 'gentle'], poses: ['armCircleA', 'armCircleB'] },

  // ---- 体幹 ----
  {
    id: 'plank',
    name: 'プランク',
    point: 'ひじをついて、体を一直線にキープ',
    tags: ['core'],
    poses: ['plankElbow'],
    easy: { name: '膝つきプランク', point: '膝をついて、頭から膝まで一直線', poses: ['plankKnee'] },
  },
  { id: 'sidePlank', name: 'サイドプランク', point: '横向きで腰を浮かせる。20秒で左右交代', tags: ['core'], poses: ['sidePlankA', 'sidePlankB'], switchSides: true },
  { id: 'crunch', name: 'クランチ', point: 'おへそをのぞき込むように、肩を浮かせる', tags: ['core'], poses: ['lieKnees', 'crunchUp'] },
  { id: 'legRaise', name: 'レッグレイズ', point: '腰を床につけたまま、脚を上げ下げ', tags: ['core'], poses: ['legsLow', 'legsUp'] },
  { id: 'bicycle', name: 'バイシクルクランチ', point: 'ひじと反対の膝を近づける。左右交互', tags: ['core'], poses: ['bicycleA', 'bicycleB'] },
  { id: 'deadBug', name: 'デッドバグ', point: '反対の手足をゆっくり伸ばす。腰は床につけたまま', tags: ['core', 'gentle'], poses: ['deadBugA', 'deadBugB'] },
  { id: 'birdDog', name: 'バードドッグ', point: '四つんばいで、反対の手足を伸ばす', tags: ['core', 'gentle'], poses: ['allFours', 'birdDogUp'] },
  { id: 'russianTwist', name: 'ロシアンツイスト', point: '座って足を浮かせ、上半身を左右にひねる', tags: ['core'], poses: ['russianA', 'russianB'] },
  {
    id: 'climber',
    name: 'マウンテンクライマー',
    point: 'お尻を上げすぎず、膝を胸へ交互に',
    tags: ['core', 'cardio'],
    poses: ['pushUp', 'climberIn'],
    easy: { name: 'マウンテンクライマー（ゆっくり）', point: '1回ずつ、膝を胸へ引きつける', poses: ['pushUp', 'climberIn'] },
  },

  // ---- 有酸素 ----
  { id: 'jumpingJack', name: 'ジャンピングジャック', point: '腕と脚を大きく開いて閉じる', tags: ['cardio'], poses: ['stand', 'jackOpen'] },
  { id: 'highKnee', name: 'もも上げ', point: '腕をしっかり振って、膝を腰の高さへ', tags: ['cardio'], poses: ['highKneeL', 'highKneeR'] },
  {
    id: 'burpee',
    name: 'バーピー',
    point: 'しゃがむ→脚を後ろへ→戻ってジャンプ',
    tags: ['cardio'],
    poses: ['crouch', 'pushUp', 'crouch', 'armsUpJump'],
    easy: { name: 'バーピー（ジャンプなし）', point: 'しゃがむ→脚を後ろへ→戻って立つ', poses: ['crouch', 'pushUp', 'crouch', 'stand'] },
  },
  { id: 'skater', name: 'スケーター', point: '左右に跳んで、片脚で着地', tags: ['cardio'], poses: ['skaterL', 'skaterR'] },
  { id: 'boxing', name: 'シャドーボクシング', point: '左右交互にパンチ。つま先で軽くステップ', tags: ['cardio', 'gentle'], poses: ['boxL', 'boxR'] },
  { id: 'march', name: 'その場足踏み', point: '腕を大きく振って、リズムよく', tags: ['gentle'], poses: ['marchL', 'marchR'] },
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

/** 強さを反映した表示用の中身 */
export const resolve = (ex: Exercise, level: Level): Variant & { hasLevels: boolean } =>
  level === 'easy' && ex.easy
    ? { ...ex.easy, hasLevels: true }
    : { name: ex.name, point: ex.point, poses: ex.poses, hasLevels: !!ex.easy }

/** やり方の動画。特定の動画に決め打ちせず、YouTubeの検索結果を開く */
export const videoUrl = (name: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} やり方`)}`

// ---- チャレンジマスのおまけ運動 ----
export type Challenge = { id: string; name: string; seconds: number; point: string; poses: PoseName[] }

export const CHALLENGES: Challenge[] = [
  { id: 'plank30', name: 'プランク 30秒', seconds: 30, point: 'ひじをついて、体を一直線にキープ', poses: ['plankElbow'] },
  { id: 'squatHold30', name: 'スクワットキープ 30秒', seconds: 30, point: 'しゃがんだ姿勢のまま止まる', poses: ['squatSide'] },
  { id: 'highKnee30', name: 'もも上げ 30秒', seconds: 30, point: '全力で！膝を腰の高さへ', poses: ['highKneeL', 'highKneeR'] },
  { id: 'jack30', name: 'ジャンピングジャック 30秒', seconds: 30, point: '腕と脚を大きく開いて閉じる', poses: ['stand', 'jackOpen'] },
  { id: 'climber30', name: 'マウンテンクライマー 30秒', seconds: 30, point: '膝を胸へ交互に', poses: ['pushUp', 'climberIn'] },
  { id: 'hipLift45', name: 'ヒップリフトキープ 45秒', seconds: 45, point: 'お尻を上げたまま止まる', poses: ['bridgeUp'] },
  { id: 'legRaise30', name: 'レッグレイズ 30秒', seconds: 30, point: '腰を床につけたまま、脚を上げ下げ', poses: ['legsLow', 'legsUp'] },
  { id: 'wideSquat30', name: 'ワイドスクワット 30秒', seconds: 30, point: '足を大きく開いて、深くしゃがむ', poses: ['wideStand', 'wideSquat'] },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]))
