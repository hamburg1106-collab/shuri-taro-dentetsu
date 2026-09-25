import type { User } from 'firebase/auth'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from './firebase'

const provider = new GoogleAuthProvider()

export const watchUser = (onChange: (user: User | null) => void): (() => void) =>
  onAuthStateChanged(auth, onChange)

/** 画面に出す文に言い換えたログインの失敗 */
export class LoginError extends Error {}

/**
 * Googleでログインする。ポップアップ方式だけを使う。
 *
 * リダイレクト方式は、iPhoneのSafariで「missing initial state」になって止まる
 * （わが家のお財布で 2026-09-25 に発生）。ログイン画面のドメイン（firebaseapp.com）と
 * アプリ（github.io）で、Safariが保存領域を分けるため。
 */
export const login = async (): Promise<void> => {
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    const code = (e as { code?: string }).code ?? ''
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
    if (code === 'auth/popup-blocked') {
      throw new LoginError(
        'ログイン用の画面が開けませんでした。もう一度押してください。' +
          '続くときは、設定アプリ → Safari →「ポップアップブロック」を一時的にオフにしてください',
      )
    }
    throw e
  }
}

export const logout = (): Promise<void> => signOut(auth)
