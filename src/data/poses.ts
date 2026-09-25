/**
 * 棒人間のポーズ。200×200 の枠で、地面は y=190。
 *
 * 関節は頭・肩・腰・左右のひじ／手／ひざ／足。横向きのポーズでは左右が重なる。
 * 1種目につき2〜4コマを用意し、運動中はこれを順番に切り替えて動きに見せる。
 */
export type Pt = readonly [number, number]

export type Pose = {
  head: Pt
  sh: Pt
  hip: Pt
  le: Pt
  lh: Pt
  re: Pt
  rh: Pt
  lk: Pt
  lf: Pt
  rk: Pt
  rf: Pt
}

/** 両腕・両脚が同じ位置（横向きのポーズ用） */
const side = (p: { head: Pt; sh: Pt; hip: Pt; e: Pt; h: Pt; k: Pt; f: Pt }): Pose => ({
  head: p.head,
  sh: p.sh,
  hip: p.hip,
  le: p.e,
  lh: p.h,
  re: p.e,
  rh: p.h,
  lk: p.k,
  lf: p.f,
  rk: p.k,
  rf: p.f,
})

/** 左右反転 */
const mirror = (p: Pose): Pose => {
  const m = (q: Pt): Pt => [200 - q[0], q[1]]
  return {
    head: m(p.head),
    sh: m(p.sh),
    hip: m(p.hip),
    le: m(p.re),
    lh: m(p.rh),
    re: m(p.le),
    rh: m(p.lh),
    lk: m(p.rk),
    lf: m(p.rf),
    rk: m(p.lk),
    rf: m(p.lf),
  }
}

/** 上下にずらす（かかと上げ・ジャンプ用） */
const lift = (p: Pose, dy: number, feetToo = true): Pose => {
  const u = (q: Pt): Pt => [q[0], q[1] - dy]
  return {
    head: u(p.head),
    sh: u(p.sh),
    hip: u(p.hip),
    le: u(p.le),
    lh: u(p.lh),
    re: u(p.re),
    rh: u(p.rh),
    lk: u(p.lk),
    lf: feetToo ? u(p.lf) : [p.lf[0], p.lf[1] - dy / 2],
    rk: u(p.rk),
    rf: feetToo ? u(p.rf) : [p.rf[0], p.rf[1] - dy / 2],
  }
}

// ---- 立ち（正面） ----
const stand: Pose = {
  head: [100, 38],
  sh: [100, 58],
  hip: [100, 112],
  le: [88, 85],
  lh: [84, 110],
  re: [112, 85],
  rh: [116, 110],
  lk: [94, 150],
  lf: [92, 188],
  rk: [106, 150],
  rf: [108, 188],
}

const jackOpen: Pose = {
  ...stand,
  le: [78, 46],
  lh: [62, 22],
  re: [122, 46],
  rh: [138, 22],
  lk: [84, 150],
  lf: [70, 188],
  rk: [116, 150],
  rf: [130, 188],
}

const armsUpJump: Pose = lift(
  { ...stand, le: [90, 38], lh: [86, 14], re: [110, 38], rh: [114, 14] },
  14,
)

const squatFront: Pose = {
  head: [100, 76],
  sh: [100, 96],
  hip: [100, 142],
  le: [86, 110],
  lh: [96, 120],
  re: [114, 110],
  rh: [104, 120],
  lk: [80, 152],
  lf: [86, 188],
  rk: [120, 152],
  rf: [114, 188],
}

const wideStand: Pose = {
  ...stand,
  le: [88, 80],
  lh: [100, 90],
  re: [112, 80],
  rh: [100, 90],
  lk: [86, 150],
  lf: [74, 188],
  rk: [114, 150],
  rf: [126, 188],
}

const wideSquat: Pose = {
  head: [100, 80],
  sh: [100, 100],
  hip: [100, 148],
  le: [88, 114],
  lh: [100, 124],
  re: [112, 114],
  rh: [100, 124],
  lk: [66, 150],
  lf: [64, 188],
  rk: [134, 150],
  rf: [136, 188],
}

const sideLungeL: Pose = {
  head: [80, 72],
  sh: [80, 92],
  hip: [88, 142],
  le: [90, 108],
  lh: [100, 118],
  re: [90, 108],
  rh: [100, 118],
  lk: [56, 152],
  lf: [54, 188],
  rk: [128, 166],
  rf: [160, 188],
}

const highKneeL: Pose = {
  ...stand,
  le: [86, 80],
  lh: [96, 66],
  re: [114, 86],
  rh: [112, 108],
  lk: [86, 112],
  lf: [90, 148],
}

const marchL: Pose = {
  ...stand,
  le: [88, 82],
  lh: [96, 100],
  re: [112, 86],
  rh: [110, 110],
  lk: [90, 128],
  lf: [92, 166],
}

const armCircleA: Pose = { ...stand, le: [76, 58], lh: [52, 58], re: [124, 58], rh: [148, 58] }
const armCircleB: Pose = { ...stand, le: [76, 50], lh: [54, 42], re: [124, 50], rh: [146, 42] }

const skaterL: Pose = {
  head: [72, 70],
  sh: [80, 88],
  hip: [94, 136],
  le: [100, 100],
  lh: [118, 112],
  re: [68, 102],
  rh: [58, 118],
  lk: [80, 160],
  lf: [76, 188],
  rk: [112, 164],
  rf: [128, 178],
}

// ---- 横向き（右を向く） ----
const standSide: Pose = side({
  head: [110, 36],
  sh: [110, 56],
  hip: [110, 120],
  e: [114, 88],
  h: [118, 116],
  k: [110, 155],
  f: [112, 188],
})

const squatSide: Pose = side({
  head: [122, 80],
  sh: [114, 96],
  hip: [88, 150],
  e: [140, 104],
  h: [164, 108],
  k: [132, 156],
  f: [120, 188],
})

const standSideFwd: Pose = { ...standSide, le: [134, 62], lh: [160, 62], re: [134, 62], rh: [160, 62] }

const lungeBack: Pose = {
  head: [104, 62],
  sh: [104, 80],
  hip: [102, 134],
  le: [96, 106],
  lh: [100, 128],
  re: [96, 106],
  rh: [100, 128],
  lk: [86, 178],
  lf: [56, 186],
  rk: [140, 140],
  rf: [140, 188],
}

const crouch: Pose = side({
  head: [128, 120],
  sh: [118, 134],
  hip: [96, 160],
  e: [132, 160],
  h: [138, 188],
  k: [124, 150],
  f: [112, 188],
})

const pushUp: Pose = side({
  head: [162, 112],
  sh: [146, 120],
  hip: [92, 132],
  e: [146, 152],
  h: [146, 188],
  k: [62, 146],
  f: [30, 170],
})

const pushDown: Pose = side({
  head: [164, 148],
  sh: [146, 158],
  hip: [92, 164],
  e: [126, 168],
  h: [146, 188],
  k: [62, 168],
  f: [30, 178],
})

const kneePushUp: Pose = side({
  head: [160, 108],
  sh: [146, 118],
  hip: [98, 142],
  e: [146, 152],
  h: [146, 188],
  k: [66, 186],
  f: [40, 160],
})

const kneePushDown: Pose = side({
  head: [164, 146],
  sh: [146, 156],
  hip: [98, 168],
  e: [126, 168],
  h: [146, 188],
  k: [66, 186],
  f: [40, 160],
})

const plankElbow: Pose = side({
  head: [162, 138],
  sh: [146, 148],
  hip: [92, 154],
  e: [146, 184],
  h: [172, 184],
  k: [62, 164],
  f: [30, 178],
})

const plankKnee: Pose = side({
  head: [162, 136],
  sh: [146, 148],
  hip: [100, 162],
  e: [146, 184],
  h: [172, 184],
  k: [66, 186],
  f: [40, 162],
})

const shoulderTap: Pose = { ...pushUp, re: [164, 140], rh: [150, 124] }

const climberIn: Pose = { ...pushUp, lk: [128, 158], lf: [116, 184] }

const pikeUp: Pose = side({
  head: [134, 158],
  sh: [128, 146],
  hip: [100, 92],
  e: [136, 168],
  h: [142, 188],
  k: [80, 140],
  f: [60, 188],
})

const pikeDown: Pose = side({
  head: [142, 178],
  sh: [130, 162],
  hip: [100, 98],
  e: [120, 176],
  h: [142, 188],
  k: [80, 142],
  f: [60, 188],
})

const dipUp: Pose = side({
  head: [74, 110],
  sh: [68, 128],
  hip: [100, 150],
  e: [64, 158],
  h: [60, 188],
  k: [140, 140],
  f: [150, 188],
})

const dipDown: Pose = side({
  head: [80, 128],
  sh: [72, 146],
  hip: [96, 172],
  e: [50, 166],
  h: [60, 188],
  k: [140, 146],
  f: [150, 188],
})

const sidePlankA: Pose = {
  head: [150, 96],
  sh: [140, 112],
  hip: [100, 146],
  le: [142, 150],
  lh: [164, 186],
  re: [120, 124],
  rh: [104, 140],
  lk: [70, 166],
  lf: [40, 186],
  rk: [70, 164],
  rf: [42, 180],
}
const sidePlankB: Pose = { ...sidePlankA, re: [142, 86], rh: [146, 60] }

// ---- 寝る（頭が左） ----
const lieKnees: Pose = side({
  head: [40, 172],
  sh: [58, 176],
  hip: [110, 182],
  e: [46, 160],
  h: [36, 168],
  k: [140, 146],
  f: [160, 186],
})

const crunchUp: Pose = { ...lieKnees, head: [60, 150], sh: [72, 162], le: [62, 140], lh: [52, 150], re: [62, 140], rh: [52, 150] }

const bridgeDown: Pose = side({
  head: [40, 176],
  sh: [58, 178],
  hip: [108, 184],
  e: [80, 186],
  h: [100, 188],
  k: [144, 146],
  f: [152, 188],
})
const bridgeUp: Pose = { ...bridgeDown, hip: [112, 142], lk: [150, 134], rk: [150, 134] }

const legsLow: Pose = side({
  head: [40, 176],
  sh: [58, 178],
  hip: [110, 182],
  e: [84, 184],
  h: [104, 186],
  k: [142, 180],
  f: [174, 176],
})
const legsUp: Pose = { ...legsLow, lk: [120, 150], lf: [126, 114], rk: [120, 150], rf: [126, 114] }

const bicycleA: Pose = {
  head: [50, 160],
  sh: [64, 168],
  hip: [110, 180],
  le: [56, 146],
  lh: [44, 158],
  re: [56, 146],
  rh: [44, 158],
  lk: [126, 144],
  lf: [150, 158],
  rk: [146, 172],
  rf: [180, 168],
}
const bicycleB: Pose = { ...bicycleA, lk: [146, 172], lf: [180, 168], rk: [126, 144], rf: [150, 158] }

const deadBugA: Pose = side({
  head: [40, 176],
  sh: [58, 178],
  hip: [110, 182],
  e: [60, 152],
  h: [62, 124],
  k: [118, 146],
  f: [146, 148],
})
const deadBugB: Pose = { ...deadBugA, le: [42, 164], lh: [22, 172], rk: [146, 168], rf: [180, 170] }

const russianA: Pose = side({
  head: [82, 104],
  sh: [88, 122],
  hip: [112, 172],
  e: [112, 138],
  h: [130, 150],
  k: [146, 146],
  f: [172, 168],
})
const russianB: Pose = { ...russianA, le: [100, 146], lh: [94, 166], re: [100, 146], rh: [94, 166] }

// ---- 四つんばい（頭が左） ----
const allFours: Pose = side({
  head: [46, 106],
  sh: [62, 112],
  hip: [130, 112],
  e: [62, 142],
  h: [62, 172],
  k: [130, 172],
  f: [166, 176],
})
const birdDogUp: Pose = { ...allFours, re: [38, 108], rh: [14, 104], rk: [160, 110], rf: [192, 108] }
const donkeyUp: Pose = { ...allFours, rk: [160, 104], rf: [158, 70] }

// ---- うつぶせ（頭が右） ----
const proneFlat: Pose = side({
  head: [160, 172],
  sh: [144, 178],
  hip: [90, 182],
  e: [170, 182],
  h: [190, 182],
  k: [60, 184],
  f: [26, 184],
})
const proneLift: Pose = side({
  head: [164, 158],
  sh: [146, 168],
  hip: [90, 180],
  e: [170, 158],
  h: [192, 148],
  k: [60, 176],
  f: [28, 164],
})

const boxL: Pose = {
  ...standSide,
  le: [134, 62],
  lh: [160, 60],
  re: [120, 78],
  rh: [128, 62],
  lk: [102, 152],
  lf: [94, 188],
  rk: [122, 152],
  rf: [132, 188],
}
const boxR: Pose = { ...boxL, le: [120, 78], lh: [128, 62], re: [134, 64], rh: [160, 62] }

export const POSES = {
  stand,
  jackOpen,
  armsUpJump,
  squatFront,
  wideStand,
  wideSquat,
  sideLungeL,
  sideLungeR: mirror(sideLungeL),
  highKneeL,
  highKneeR: mirror(highKneeL),
  marchL,
  marchR: mirror(marchL),
  armCircleA,
  armCircleB,
  skaterL,
  skaterR: mirror(skaterL),
  calfUp: lift(stand, 10, false),
  standSide,
  standSideFwd,
  squatSide,
  lungeBack,
  crouch,
  pushUp,
  pushDown,
  kneePushUp,
  kneePushDown,
  plankElbow,
  plankKnee,
  shoulderTap,
  climberIn,
  pikeUp,
  pikeDown,
  dipUp,
  dipDown,
  sidePlankA,
  sidePlankB,
  lieKnees,
  crunchUp,
  bridgeDown,
  bridgeUp,
  legsLow,
  legsUp,
  bicycleA,
  bicycleB,
  deadBugA,
  deadBugB,
  russianA,
  russianB,
  allFours,
  birdDogUp,
  donkeyUp,
  proneFlat,
  proneLift,
  boxL,
  boxR,
} satisfies Record<string, Pose>

export type PoseName = keyof typeof POSES
