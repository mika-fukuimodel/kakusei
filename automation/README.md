# 覚醒モデル｜毎日1記事 自動投稿システム

AI × 脳神経科学 / 複雑系科学 の短い記事を、**毎日1本ずつ自動で X と Instagram に投稿**する仕組みです。

- スマホ1画面に収まる縦長カード画像（1080×1350）を自動生成（既存サイトと同じ金×黒の世界観）
- 記事は `content/posts.json` にストックし、毎日1本ずつ順番に投稿
- テーマは4軸（AI×脳神経科学 / AI×複雑系 / 信頼の科学 / 最新AIトレンド）を順番にローテーション
- GitHub Actions が毎朝 7:00（日本時間）に自動実行

```
automation/
├── content/
│   ├── posts.json    ← 投稿する記事のストック（ここを書き足していく）
│   └── state.json    ← どこまで投稿したかの記録（自動更新）
├── scripts/
│   ├── render.mjs        ← 記事 → カード画像
│   ├── post-x.mjs        ← X へ投稿
│   ├── post-instagram.mjs← Instagram へ投稿
│   └── post-next.mjs     ← 次の記事を両方へ投稿し、記録を更新
└── output/cards/     ← 生成された画像（自動コミット）
```

## 全体の流れ

1. 毎朝 GitHub Actions が起動
2. `state.json` を見て「次の未投稿記事」を1本選ぶ
3. その記事をカード画像にする
4. 画像をリポジトリに保存（Instagramが読み込む公開URLになる）
5. X と Instagram に同じ画像で投稿
6. 「投稿済み」として記録 → 翌日は次の記事へ

## まず試す（APIなしでもOK）

トークンが未設定でも、画像生成までは動きます（投稿だけスキップ）。

```bash
cd automation
npm install
npx playwright install chromium
npm run preview      # 次の記事のカード画像を output/cards/ に生成
```

→ 仕上がりイメージを確認できます。文章は `content/posts.json` を直接書き換えればOKです。

## 自動投稿を有効にする

X と Instagram のトークンを **GitHub のリポジトリ Secrets** に登録すると、自動投稿が始まります。
取得手順は [SETUP_ja.md](./SETUP_ja.md) を参照してください。

| Secret 名 | 内容 |
|---|---|
| `X_API_KEY` / `X_API_SECRET` | X アプリの API Key / Secret |
| `X_ACCESS_TOKEN` / `X_ACCESS_SECRET` | X のアクセストークン（書き込み権限） |
| `IG_USER_ID` | Instagram ビジネスアカウントのID |
| `IG_ACCESS_TOKEN` | Meta の長期アクセストークン |

登録後は **Actions タブ → Daily auto post → Run workflow** で手動テストできます。

## 記事を増やす

`content/posts.json` の配列に、同じ形式で追記するだけです。

```json
{
  "id": "005-xxxx",                    // 重複しない任意のID
  "theme": "AI×複雑系科学",            // カード上部のタグ
  "title": "見出し\n（改行で2行に）",
  "lead": "1〜2行の要約（リード文）",
  "body": ["箇条書き1", "箇条書き2", "..."],   // 4〜5項目が目安
  "closing": "締めの一言",
  "hashtags": ["#AI", "#脳科学", "#覚醒モデル"]
}
```

> 文章量の目安：箇条書き4〜5項目まで。これ以上だとカードからはみ出すことがあります。
> 追加後に `npm run preview` で必ず見た目を確認してください。

## よくある質問

- **なぜ画像で投稿するの？** Instagram はテキストだけの投稿ができず、画像か動画が必須のためです。1枚の画像にまとめることで、X と Instagram の両方に同じ内容を出せます。
- **投稿時刻を変えたい** `.github/workflows/daily-post.yml` の `cron` を編集します（UTC基準。`0 22 * * *` = 日本時間7:00）。
- **記事が尽きたら？** その日は何も投稿されず、ログに「未投稿の記事がありません」と出ます。`posts.json` に書き足してください。
