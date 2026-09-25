/**
 * 音声の読み上げ（ブラウザの読み上げ機能）。音声ファイルは持たない。
 * iPhoneは、ボタンを押した流れの中で1回しゃべらせないと、その後も鳴らないことがある。
 * そのため「出発進行！」を押したときに unlock() を呼ぶ。
 */
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

let voice: SpeechSynthesisVoice | undefined
const pickVoice = () => {
  voice = synth?.getVoices().find((v) => v.lang.startsWith('ja'))
}
pickVoice()
synth?.addEventListener?.('voiceschanged', pickVoice)

let enabled = true
export const setSpeechEnabled = (on: boolean) => {
  enabled = on
  if (!on) synth?.cancel()
}

export const speak = (text: string) => {
  if (!synth || !enabled) return
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  if (voice) u.voice = voice
  u.rate = 1.05
  synth.speak(u)
}

export const unlockSpeech = () => speak('出発進行！')

/** 運動中に画面が消えないようにする（対応している端末だけ） */
export const keepAwake = async (): Promise<() => void> => {
  try {
    const lock = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen')
    return () => void lock?.release()
  } catch {
    return () => {}
  }
}
