/**
 * 新しいService Workerが主導権を取ったら、自動で画面を読み込み直す。
 * これが無いと、更新が反映されるのが「次にアプリを開いたとき」になる。
 * （わが家のお財布から流用）
 */
const SAFE_WINDOW_MS = 30_000
const RETURN_GRACE_MS = 1_500

/** 運動中など、読み込み直すと困るあいだ true */
let held = false

export const holdUpdate = (hold: boolean): void => {
  held = hold
}

export const reloadOnServiceWorkerUpdate = (): void => {
  if (!('serviceWorker' in navigator)) return
  if (!navigator.serviceWorker.controller) return

  const loadedAt = Date.now()
  let done = false

  const reload = () => {
    if (done) return
    done = true
    window.location.reload()
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (Date.now() - loadedAt < SAFE_WINDOW_MS) {
      reload()
      return
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      setTimeout(() => {
        if (document.visibilityState === 'visible' && !held) reload()
      }, RETURN_GRACE_MS)
    })
  })
}
