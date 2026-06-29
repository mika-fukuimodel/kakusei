# セットアップ手順（X・Instagram のトークン取得）

自動投稿には、X と Instagram それぞれの「投稿用トークン」が必要です。
取得したら、GitHub のリポジトリに **Secrets** として登録します。最後の「GitHubに登録」の章を必ず実施してください。

> 専門用語が多く感じても大丈夫です。順番にコピペしていけば設定できます。
> どうしても難しければ、取得したキーをこのチャットに貼らずに「ここで詰まった」と教えてください（**キーは絶対に他人やチャットに貼らないこと**）。

---

## 1. X（旧Twitter）のトークン

### 必要なもの
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_SECRET`

### 手順
1. 投稿に使う X アカウントでログインし、[X Developer Portal](https://developer.x.com/) を開く。
2. 開発者アカウントを申請（無料の Free プランでOK。用途を聞かれたら「自分のアカウントへの自動投稿」と回答）。
3. **Projects & Apps** で新しい App を作成する。
4. App の設定 →「**User authentication settings**」を開き、
   - App permissions: **Read and Write**（書き込み必須）
   - Type of App: **Web App / Automated App or Bot**
   - Callback URL / Website は自分のサイトURL（例: `https://example.com`）でOK。
   - 保存する。
5. 「**Keys and tokens**」タブを開く：
   - **API Key and Secret** → これが `X_API_KEY` / `X_API_SECRET`
   - **Access Token and Secret** → 「Generate」で発行 → `X_ACCESS_TOKEN` / `X_ACCESS_SECRET`
   - ⚠️ Access Token は **権限を Read and Write にした後に発行** すること（先に発行した場合は再発行）。

> 注意：Free プランは月の投稿数に上限があります（1日1投稿なら十分です）。

---

## 2. Instagram のトークン

Instagram は個人アカウントでは API 投稿できません。**「プロアカウント（ビジネス/クリエイター）」＋ Facebook ページ** が必要です。

### 必要なもの
- `IG_USER_ID`（Instagram ビジネスアカウントの数値ID）
- `IG_ACCESS_TOKEN`（長期アクセストークン）

### 事前準備
1. Instagram アプリで、アカウントを **プロアカウント（ビジネス）** に切り替える。
2. [Facebook ページ](https://www.facebook.com/pages/create) を1つ作る（中身は空でOK）。
3. Instagram の設定で、その Facebook ページと **連携（リンク）** する。

### 手順
1. [Meta for Developers](https://developers.facebook.com/) でログインし、**アプリを作成**（種類は「ビジネス」）。
2. アプリに **Instagram Graph API** を追加する。
3. [Graph API Explorer](https://developers.facebook.com/tools/explorer/) を開く：
   - 自分のアプリを選択。
   - 「Generate Access Token」で以下の権限（スコープ）を許可：
     `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`
   - 発行されたトークンをコピー（これは短期トークン）。
4. **長期トークンに変換**（短期は数時間で切れるため）。下記URLの3か所を置き換えてブラウザで開く：
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=【アプリID】&client_secret=【アプリのシークレット】&fb_exchange_token=【短期トークン】
   ```
   返ってきた `access_token` が `IG_ACCESS_TOKEN`（約60日有効）。
5. **IG_USER_ID を取得**。下記URLの2か所を置き換えてブラウザで開く：
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token=【長期トークン】
   ```
   → Facebook ページの `id`（ページID）をメモ。続けて：
   ```
   https://graph.facebook.com/v21.0/【ページID】?fields=instagram_business_account&access_token=【長期トークン】
   ```
   → 返ってきた `instagram_business_account.id` が `IG_USER_ID`。

> 注意：長期トークンは約60日で失効します。更新時期が来たら手順4をやり直すか、自動更新の仕組みを後で追加できます（必要なら相談してください）。

---

## 3. GitHub に登録（Secrets）

取得した値を、リポジトリの Secrets に登録します。

1. GitHub でこのリポジトリを開く。
2. **Settings → Secrets and variables → Actions** を開く。
3. **New repository secret** を押し、以下を1つずつ登録（名前は完全一致で）：

   | Name | Value |
   |---|---|
   | `X_API_KEY` | Xの API Key |
   | `X_API_SECRET` | Xの API Secret |
   | `X_ACCESS_TOKEN` | Xの Access Token |
   | `X_ACCESS_SECRET` | Xの Access Token Secret |
   | `IG_USER_ID` | Instagramビジネスアカウントの数値ID |
   | `IG_ACCESS_TOKEN` | Metaの長期アクセストークン |

4. 登録できたら **Actions タブ → 「Daily auto post」→ Run workflow** で手動テスト。
   - ログに「投稿成功」が出れば完了です。
   - 片方だけ設定しても、設定済みのほうだけ投稿されます（未設定はスキップ）。

---

## トラブル時のチェック

- **X: 401 Unauthorized** → 権限が Read のまま。Read and Write にして Access Token を再発行。
- **Instagram: (#10) ... permission** → 権限スコープ不足、またはプロアカウント＆ページ連携ができていない。
- **Instagram: 画像が読み込めない** → 画像のpushが完了する前に投稿しようとした可能性。再実行で解消することが多いです。
- どのケースも、Actions の実行ログにエラー内容が日本語/英語で表示されます。
