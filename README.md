# 今これ、どっち？

旬の損得・答え合わせラボ。日本のスマートフォン利用者向けに、日常の2択を自分の条件で比べる12種類の無料計算ツールです。

## 開発・ビルド

Node.js 22以上。アプリの実行・ビルドに外部依存パッケージ、有料API、DBは不要です。

```sh
npm test
npm run build
node tests/site-check.mjs
npm start
```

`http://localhost:4173` を開きます。Cloudflare Pagesは `main`、ビルドコマンド `npm run build`、出力 `dist`、プリセット `None`。`dist` はビルドで生成し、直接アップロードにも使えます。Git連携後はソース変更で自動ビルドできます。

公開URLは `https://ima-docchi-2x9.pages.dev` です。別URLへ移転する場合はCloudflareの `SITE_URL` 環境変数に新しい実URLのオリジンを設定して再ビルドしてください。公開状態は `docs/STATUS.md` で確認してください。

## 構成

- `src/catalog.mjs`：9常設＋3旬枠の入力定義、固有の注意事項、計算式
- `src/calculator.mjs`：DOMに依存しない入力検証・計算
- `src/build.mjs`：18ページ＋404・SEO・サイトマップを生成
- `src/app.mjs`：入力時の即時更新・予想・ページ共有
- `content/seasonal.json`：タイトル・概要・入力条件・出典URL・確認日時・掲載期限・確認状態
- `content/ads.json` / `src/ads.mjs`：広告設定と失敗時処理。初期状態は無効
- `tests/`：計算境界値・サイト整合性・ブラウザ検証

入力値はブラウザ内でのみ計算し、Cookie・localStorageへ保存しません。共有URLにも個別入力を含めません。初期値はすべて架空の計算例です。

## 旬の更新

`docs/OPERATIONS.md` を参照。既存のスケジュールは変更していません。自動収集・自動更新の定期実行は未設定です。

## 広告

Adsterra新規サイト登録・審査・正式コード発行後に接続します。別サイトのコード、ダミー広告、強制クリック、報酬付き誘導は使いません。Social Barは形式の設定を確認してから導入します。Interstitialの実配信・頻度制御は未実装です。
