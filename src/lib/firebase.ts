import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// ウェブ用のconfigは公開前提の識別子（秘密鍵ではない）。
// 実際の保護はFirestoreのセキュリティルールで行い、夫婦2人のuidだけを通す。
//
// プロジェクトは他のアプリと共用し、コレクション名（shuritaro）で分ける。
const firebaseConfig = {
  apiKey: 'AIzaSyDSGP41IVUjfERDN9-4Nnm6_tAJPVeISgg',
  authDomain: 'ouchi-no-kondate.firebaseapp.com',
  projectId: 'ouchi-no-kondate',
  storageBucket: 'ouchi-no-kondate.firebasestorage.app',
  messagingSenderId: '385279752727',
  appId: '1:385279752727:web:59068d4c3d5cbd000b3a52',
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// 電波の弱い場所でも開けるよう、端末にも控えを持つ
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
