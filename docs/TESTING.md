# 検証

`npm run check` で計算テスト508件と静的サイトチェックが動きます。外部APIや有料サービス不要です。

`tests/browser-check.mjs` はPlaywrightとChromiumがある開発環境で動きます。実行例：

```sh
TEST_CHROMIUM=/path/to/chromium node tests/browser-check.mjs
```

Playwrightがグローバル共有ランタイムにある場合は `CODEX_PRIMARY_RUNTIME_NODE_MODULES` を参照します。通常は開発専用にPlaywrightをインストールしてください。本番サイトの依存関係ではありません。

テスト対象：4画面幅×トップ＋12比較、入力変更、空欄・負数、リセット、予想、関連導線、共有URLコピー／手動コピー代替、404、広告設定の通信失敗。結果は `docs/browser-report.json`。

ブラウザ試験でリセット時の再描画順序の問題を検出し修正。全試験成功後のスクリーンショットで日本語の表示も確認しました。

未確認：Android実機、端末共有シート、Cloudflare公開URLでの検証。画面幅のエミュレーションと実機の動作確認は区別しています。
