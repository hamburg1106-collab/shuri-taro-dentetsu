// ゲームのルールと日付・メニューの計算を、Firebaseなしで確かめる。使い方: npm run check
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const load = (p) => server.ssrLoadModule(p)

try {
  const date = await load('/src/lib/date.ts')
  const menu = await load('/src/lib/menu.ts')
  const maps = await load('/src/data/maps.ts')
  const game = await load('/src/lib/game.ts')
  const ex = await load('/src/data/exercises.ts')
  const poses = await load('/src/data/poses.ts')
  const types = await load('/src/types.ts')

  // ---- 日付 ----
  assert.equal(date.weekday('2026-09-25'), 5, '9/25は金曜')
  assert.equal(date.addDays('2026-09-30', 1), '2026-10-01')
  assert.equal(date.mondayOf('2026-09-27'), '2026-09-21', '日曜の週の月曜')
  assert.deepEqual(date.lastWeekDays('2026-09-28'), ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'])
  assert.equal(date.dateKey(new Date('2026-09-25T15:30:00Z')), '2026-09-26', '日本時間の0時半は翌日')
  console.log('✓ 日付')

  // ---- メニュー ----
  for (let i = 0; i < 60; i++) {
    const key = date.addDays('2026-09-25', i)
    const m = menu.menuOf(key)
    assert.equal(m.length, 5, `${key} は5種目`)
    assert.equal(new Set(m.map((e) => e.id)).size, 5, `${key} に重複なし`)
    assert.deepEqual(menu.menuOf(key).map((e) => e.id), m.map((e) => e.id), '同じ日なら同じメニュー')
  }
  console.log('✓ メニュー（60日分: 5種目・重複なし・毎回同じ）')
  let differ = 0
  for (let i = 0; i < 28; i++) {
    const key = date.addDays('2026-09-25', i)
    const a = menu.menuOf(key, 1).map((e) => e.id)
    const b = menu.menuOf(key, 2)
    assert.equal(b.length, 5, `${key} の2本目も5種目`)
    if (b.some((e) => !a.includes(e.id))) differ++
  }
  assert.ok(differ >= 20, `2本目は1本目と違う種目が出る日が多い（${differ}/28日）`)
  console.log(`✓ 2本目のメニュー（28日中${differ}日で1本目と違う種目）`)
  console.log('  9/25（金）:', menu.menuOf('2026-09-25').map((e) => e.name).join(' / '))

  // ---- 種目とポーズ ----
  for (const e of ex.EXERCISES) {
    for (const p of [...e.poses, ...(e.easy?.poses ?? [])]) assert.ok(poses.POSES[p], `${e.name} のポーズ ${p} がある`)
  }
  for (const c of ex.CHALLENGES) for (const p of c.poses) assert.ok(poses.POSES[p], `${c.name} のポーズ ${p}`)
  console.log(`✓ 種目 ${ex.EXERCISES.length}個・チャレンジ ${ex.CHALLENGES.length}個のポーズがそろっている`)

  // ---- マップ ----
  for (const [i, m] of maps.MAPS.entries()) {
    const sq = maps.squaresOf(m)
    assert.equal(sq.length, 251)
    assert.equal(sq[0], 'station')
    assert.equal(sq[250], 'station', `${m.title} のゴールは駅`)
    const count = (k) => sq.filter((s) => s === k).length
    console.log(`✓ マップ${i + 1} ${m.title}: ご褒美${count('reward')} チャレンジ${count('challenge')} 駅${count('station')}`)
  }

  // ---- サイコロの数（夫婦ボーナス） ----
  const day0 = { ...types.EMPTY_DAY }
  assert.deepEqual(game.diceForCompletion(day0, 'A'), { count: 1, reason: 'normal' }, '1人目は1個')
  const day1 = { done: { A: 1 }, order: ['A'], challenges: {} }
  assert.deepEqual(game.diceForCompletion(day1, 'B'), { count: 2, reason: 'bonus' }, '2人目は2個')
  assert.equal(game.diceForCompletion(day1, 'A'), null, '同じ人は1日1回')
  console.log('✓ サイコロの数（1人目1個・2人目2個・1日1回）')

  // ---- 進む ----
  const base = { ...types.EMPTY_MAIN, members: { A: { role: 'danna' } } }
  const r1 = game.advance({ ...base, position: 10, pending: { A: { dice: [3, 4], reason: 'bonus' } } }, 'A', () => 0.5)
  assert.equal(r1.result.to, 17)
  assert.equal(r1.patch.position, 17)
  const r2 = game.advance({ ...base, position: 245, pending: { A: { dice: [6, 6], reason: 'bonus' } } }, 'A', () => 0.5)
  assert.equal(r2.result.to, 250, 'ゴールを越えたら250で止まる')
  assert.equal(r2.result.goal, true)
  const r3 = game.advance({ ...base, position: 0, plusOne: 2, pending: { A: { dice: [2], reason: 'normal' } } }, 'A', () => 0.5)
  assert.equal(r3.result.total, 3, '+1が効く')
  assert.equal(r3.patch.plusOne, 1, '+1を1つ使う')
  // ご褒美マスを探して止まらせる
  const sq1 = maps.squaresOf(maps.MAPS[0])
  const rw = sq1.findIndex((k, i) => i > 6 && k === 'reward')
  const r4 = game.advance({ ...base, position: rw - 1, pending: { A: { dice: [1], reason: 'normal' } } }, 'A', () => 0.1)
  assert.equal(r4.result.reward, 'reroll')
  assert.equal(r4.patch['cards.reroll'], 1)
  const r5 = game.advance({ ...base, position: rw - 1, pending: { A: { dice: [1], reason: 'normal' } } }, 'A', () => 0.9)
  assert.equal(r5.result.reward, 'advance3')
  assert.equal(r5.result.to, rw + 3)
  const ch = sq1.findIndex((k, i) => i > 6 && k === 'challenge')
  const r6 = game.advance({ ...base, position: ch - 2, pending: { A: { dice: [2], reason: 'normal' } } }, 'A', () => 0.3)
  assert.ok(ex.CHALLENGE_BY_ID[r6.result.challengeId], 'チャレンジが選ばれる')
  const r7 = game.advance({ ...base, position: 55, pending: { A: { dice: [5], reason: 'normal' } } }, 'A', () => 0.5)
  assert.equal(r7.result.station?.name, '小田原', '駅に止まると駅名が出る')
  console.log('✓ 進む（ゴールで止まる・+1・ご褒美・チャレンジ・駅）')

  // 進め忘れのサイコロに足す
  assert.deepEqual(game.mergePending({ dice: [3], reason: 'normal' }, [5, 2], 'bonus'), { dice: [3, 5, 2], reason: 'bonus' })
  assert.equal(game.nextMapIndex(2, 3), 0, '3枚目の次は1枚目')
  console.log('✓ 進め忘れの合算・次のマップ')
  console.log('\nすべてOK')
} finally {
  await server.close()
}
