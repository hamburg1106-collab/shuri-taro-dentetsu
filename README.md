# しゅり太郎電鉄

夫婦で毎日5分の運動をして、サイコロを振って日本を旅する、桃鉄風すごろくのPWA。

- 公開先: https://hamburg1106-collab.github.io/shuri-taro-dentetsu/
- 仕様: 作業スペースの `draft/しゅり太郎電鉄-仕様.md`
- Firebase: `ouchi-no-kondate` を他のアプリと共用。データは `shuritaro/main` 以下

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 手元で起動 |
| `npm run build` | 型チェックとビルド |
| `npm run check` | ゲームのルール・日付・メニューの検算 |
| `npm run cutout` | しゅりまるのイラストを `public/img/` に書き出す（元画像は作業スペースの `inbox/shuri-taro/`） |
| `npm run icons` | アイコンを作り直す |

## 初回の準備

1. `firestore.rules` のブロックを、Firebaseコンソールのルールに**書き足す**（置き換えない）
2. `main` にpushすると GitHub Actions がビルドして公開する
