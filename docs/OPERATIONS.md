# 運営・公開・広告の手順

## 初期版の確認

提供された `ima-docchi-pages.zip`（5ファイル）を読みました。既存版はモーダル式12ツールで、今回指定のクーポン、乗り放題券、ポイント期限、旬の3枠を満たしていませんでした。ポイント・送料・会員・年払い・宿泊の考え方を引き継ぎ、個別URL、即時計算、厳格な入力検証、切り捨て位置の明示、差額・分岐点を実装し直しました。

## Cloudflare Pages（無料枠、Git連携）

1. Cloudflareの既存アカウントにログインし、Workers & Pagesで `ima-docchi` の既存有無を確認。
2. 未作成ならCreate application → Pages → Import an existing Git repository。
3. `MORRY1992/ima-docchi` を選ぶ。新たなGitHubアクセス権が必要な場合は本人操作で対象リポジトリだけを許可。
4. プロジェクト名 `ima-docchi`、ブランチ `main`、プリセット `None`、ビルド `npm run build`、出力 `dist`。有料オプションを選ばない。
5. 保存・デプロイ後、実際に返されたURLを開く。URLが想定と異なる場合、`SITE_URL=https://実際のホスト名` を設定して再ビルド。
6. トップ、12計算、共通ページ、404、sitemap.xml、robots.txtを公開URLで検証。
7. Search ConsoleのURLプレフィックスプロパティに実URLを追加。本人の所有権確認コードを取得して配置し、`sitemap.xml` を送信（本実装では未実施）。

公式資料（2026-11-02確認）：
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/build-configuration/

## 旬の3枠

`content/seasonal.json` を変更します。`inputConditions` は対応する計算ツールの入力名のみ。項目の追加・式の変更にはコード変更とテストが必要です。

確認状態：`example`（架空例）、`pending`（再確認待ち）、`verified`（公式確認済み）、`ended`（終了）。

`verified` には公式 `sourceUrls`、`lastCheckedAt`、`startsAt`、`endsAt` が必要。日時はタイムゾーン付きISO 8601（例：`2026-11-02T09:00:00+09:00`）。現行コードはビルド時に期間を判定し、終了・未確認・開始前は汎用の計算例に戻します。入力の価格・条件を事実として掲載する場合は必ず公式原文と照合してください。データに `verified` と書くだけでは検証したことになりません。

日次：公式の新着と終了案件の確認 → 対象JSONのみ修正 → テスト・ビルド → GitHub保存 → デプロイ確認。
週次：12比較、リンク、360/390/768/1280px、共有導線の点検。
月次：実測のアクセス・広告収益・再訪問を照合。現在は解析・広告が未導入でデータはありません。

定期実行を可能にする条件：対象GitHubの読書き権限、CloudflareのGit連携、公式サイトの閲覧、必要に応じ広告・解析の読取接続。既存の「Webサイト日次運営・検索対策」への統合は本人指示後に行います。未設定のまま自動更新とは表示しません。掲載終了の自動切替には定期再ビルドが必要です。

## Adsterra接続（設定済み・配信確認中）

2026年11月2日、サイトID 6169235は承認済み。Social Bar枠ID 32050386はActive。専用スクリプトと公開ドメインを設定済み。広告クリエイティブの表示と収益は要確認。Social BarにはInterstitialが含まれる場合があり、単体の形式制御や頻度は本サイトのコードでは保証できません。以下は運用・再設定時の参照手順です。

1. 既存Publisherアカウントで Websites → Add Website。公開確認したドメインと実際のカテゴリを指定。
2. Social Barを選択し審査へ。既存サイトの広告コードを転用しない。
3. Approvedを確認して、そのドメインの正式スクリプトを取得。
4. Social Barの提供形式にはInterstitialが含まれる場合があります。今回の実験では最初から意図せず全画面広告が配信されないよう、管理画面／サポートで配信形式と頻度を確認。必要ならサポートへ本人が問い合わせる。
5. `content/ads.json` と `src/ads.mjs` を正式コード仕様に合わせて実装。現在のローダーは無効で、単にURLを入れて配信済みとは扱わない。`approvedOrigin`、`policyReviewed`、`approvalStatus`も必要。
6. 広告公式の配置指定（Social Barは閉じbodyタグ直前）を守る。CSP (`src/build.mjs` の `_headers`) には正式コードで必要となる配信元だけを追加。ワイルドカードで全面許可しない。
7. プライバシー説明と必要な同意手段を更新。スマホでボタンとの重なり・閉じる操作・広告ブロック／通信失敗時を検証。
8. 広告の自己クリックは行わず、管理画面の配信・収益表示を確認。初収益・月3,000円・1万円・3万円は目標で予測ではない。

広告出典（2026-11-02確認）：
- https://adsterra.com/blog/publishers-guide-to-social-bar/
- https://adsterra.com/blog/set-up-publishers-dashboard/
