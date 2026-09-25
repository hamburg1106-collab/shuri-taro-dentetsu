import { useState } from 'react'
import { LoginError, login } from '../lib/auth'
import { Logo } from './parts'

/**
 * LINEなどのアプリ内ブラウザか。
 * ここではGoogleがログインを受け付けず「ログイン中…」のまま止まる（わが家のお財布で確認済み）。
 */
const ua = navigator.userAgent
const inLine = /\bLine\//i.test(ua)
const inAppBrowser = inLine || /FBAN|FBAV|Instagram/i.test(ua)

/** LINEはこの指定が付いたリンクを外のブラウザ（iPhoneならSafari）で開き直す */
const externalUrl = `${location.origin}${location.pathname}?openExternalBrowser=1`

export const LoginGate = () => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (inAppBrowser) {
    return (
      <div className="gate sea">
        <Logo />
        <div className="win">
          <p>
            {inLine ? 'LINE' : 'アプリ'}の中の画面では、Googleでログインできません。
            <br />
            SafariやChromeで開き直してください。
          </p>
        </div>
        {inLine ? (
          <a className="btn" href={externalUrl}>
            Safariで開く
          </a>
        ) : (
          <p>右上（または右下）のメニューから「ブラウザで開く」を選んでください。</p>
        )}
      </div>
    )
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await login()
    } catch (e) {
      setError(e instanceof LoginError ? e.message : `ログインできませんでした（${e instanceof Error ? e.message : String(e)}）`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate sea">
      <Logo />
      <div className="win">
        <p>
          毎日5分の運動で、サイコロを振って
          <br />
          2人で日本を旅するすごろくです。
        </p>
      </div>
      <button className="btn" onClick={() => void run()} disabled={busy}>
        {busy ? 'ログイン中…' : 'Googleでログイン'}
      </button>
      {error && <p className="error">{error}</p>}
      <p style={{ fontSize: 12 }}>
        開いたら、共有ボタンから「ホーム画面に追加」しておくと
        <br />
        次からはアイコンから開けます。
      </p>
    </div>
  )
}
