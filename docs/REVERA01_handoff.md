# REVERA01 / kakusei 引き継ぎ資料

作成日: 2026-07-13 JST  
対象リポジトリ: https://github.com/mika-fukuimodel/kakusei  
この資料の目的: 別の AI、特に Claude が、ユーザーからの一言指示だけで REVERA01 の改修に安全に着手できる状態を作る。

## 0. 最重要の非交渉要件

Claude は、どの改修でも以下を最優先で守ること。

- 七段階ステージは名称・順序ともに不変。
  1. 封鎖状態
  2. 信頼の構築
  3. 潜在意識の顕在化
  4. 主体の回復
  5. 小さな挑戦
  6. 障害の突破
  7. 場の創造と還元
- 参加者コード方式による疑似匿名化を維持する。
- 氏名、住所、電話番号、詳細な所属先などの実名個人情報を必須化しない。
- 静的 HTML + GitHub Pages の公開方式を維持する。
- Supabase RLS を弱めない。匿名ロールで他参加者の機微な記録を読める状態を広げない。
- `.env.notify`、Supabase `service_role` key、LINE トークン、個人 ID などの秘匿値を読まない、貼らない、コミットしない。
- Supabase publishable key は `index.html` と運用スクリプトに既に公開済みのため、この資料では記載可。ただし secret key ではない。

## 1. リポジトリ現況

### 1.1 main の最新コミット

この資料作成開始時点の `main` / `origin/main`:

| 項目 | 内容 |
|---|---|
| commit | `e4921e48c10b87c747a2819ce2b5716ced8816fe` |
| AuthorDate | `2026-07-06 14:08:22 +0900` |
| CommitDate | `2026-07-06 14:08:22 +0900` |
| message | `Set operator name to Mika Goto in policy pages (#8)` |
| working tree | clean |

注意: この資料を追加したコミットが push された後は、`main` の最新コミットは本資料追加コミットになる。上記は「本資料追加前の実装ベースライン」である。

### 1.2 全ファイル一覧

本資料追加前に `main` に存在する全ファイル:

| パス | 行数 | 役割 |
|---|---:|---|
| `.github/workflows/pages.yml` | 32 | GitHub Pages デプロイ workflow。`main` push と手動実行で Pages artifact をアップロードする。 |
| `index.html` | 1689 | REVERA01 本体。CSS/HTML/JS を単一ファイルに持つ Supabase 直結アプリ。 |
| `privacy.html` | 137 | プライバシーポリシー。運営者名、取得情報、仮名化、Supabase 保存、問い合わせ導線を記載。 |
| `revera.html` | 397 | localStorage 版の旧/補助入力ページ。正典は `index.html`。 |
| `security.html` | 130 | セキュリティポリシー。仮名化、アクセス制御、インシデント対応、問い合わせ導線を記載。 |
| `docs/REVERA01_handoff.md` | 約784 | 本資料。コミット時点で追加されるため、最終行数は微差の可能性あり。 |

### 1.3 ファイル別の要約と構成メモ

#### `index.html`

- 役割: REVERA01 の本体。
- 構成:
  - 1-10行付近: HTML head、Google Fonts、Supabase JS CDN 読み込み。
  - 12-715行: CSS。ダーク UI、暖色アクセント、七段階カラー、ログイン、参加者、支援者、ディレクター画面のスタイル。
  - 717-955行: HTML body。ログイン/登録/コード忘れ、参加者画面、支援者画面、ディレクター画面。
  - 957-1687行: JavaScript。Supabase client、ログイン、登録、参加者フォーム生成、支援者観察保存、ディレクターダッシュボード。
- 重要な JS 定義:
  - `SUPABASE_URL`: `https://dteuzcpgjoluehfzbobn.supabase.co`
  - `SUPABASE_KEY`: publishable key。
  - 固定コード: `director2026`, `supporter2026`
  - テストコード: `TEST`, `TEST1` - `TEST7`
  - 七段階定義: `stageNames`, `stageKanji`, `stageDefinitions`
  - 参加者記録送信: `submitEvent()`
  - 支援者観察送信: `submitObservation()`
  - ディレクター画面取得: `loadDirectorData()`
- 注意点:
  - `PASSWORDS` 定義はあるが、現状の `handleLogin()` は直接 `director2026` / `supporter2026` を判定しており、`PASSWORDS` は実質未使用。
  - 新規登録の参加者/支援者ボタンに旧テーマ色らしい inline style が残る。
  - ディレクター画面の最近の記録、アラート、変容トリガーは `participant_id` の UUID 断片表示になっている。
  - `innerHTML` でユーザー入力由来の文字列を表示する箇所があるため、今後の改修では XSS に注意。

#### `privacy.html`

- 役割: REVERA01 のプライバシーポリシー。
- 構成:
  - 1-9行: head、Google Fonts。
  - 10-41行: CSS。`index.html` と同系統のダークテーマ。
  - 43-137行: 本文。取得情報、利用目的、第三者提供、Supabase 利用、安全管理、削除請求、問い合わせ。
- 重要事項:
  - 運営者名は `Mika Goto`。
  - 参加者は氏名ではなく参加者コードで識別する仮名化を明記。
  - お問い合わせフォーム URL が入っている。

#### `security.html`

- 役割: REVERA01 のセキュリティポリシー。
- 構成:
  - 1-9行: head、Google Fonts。
  - 10-41行: CSS。
  - 43-130行: 本文。基本方針、適用範囲、仮名化、通信暗号化、保管とアクセス制御、インシデント対応、問い合わせ。
- 重要事項:
  - 参加者コードによる仮名化を明記。
  - 役割に応じた画面・機能分離を明記。
  - お問い合わせフォーム URL が入っている。

#### `revera.html`

- 役割: localStorage 版の旧/補助ページ。
- 構成:
  - 単一 HTML。独自 CSS と JavaScript を含む。
  - `localStorage.getItem('revera_records')` / `localStorage.setItem('revera_records')` でブラウザ内保存。
- 注意点:
  - Supabase には接続しない。
  - REVERA01 の正典は `index.html` であり、`revera.html` は補助/旧版扱い。

#### `.github/workflows/pages.yml`

- 役割: GitHub Pages デプロイ。
- trigger:
  - `push` to `main`
  - `workflow_dispatch`
- 公開対象:
  - `actions/upload-pages-artifact@v3` の `path: .`
  - つまり `main` ブランチのリポジトリルート全体を Pages artifact として公開する。

### 1.4 ブランチ一覧と main 未マージ差分

`2026-07-13 JST` に `git fetch --all --prune` 後に確認。

| ブランチ | main に未マージの差分 | メモ |
|---|---:|---|
| `origin/main` | なし | main 本体。 |
| `origin/feature/operator-name` | 実質なし | `ahead_of_main=1` だが diff は空。PR #8 で main に内容反映済み。 |
| `origin/feature/code-recovery` | あり | コード再通知 PR の古いブランチ。main 側の policy 運営者名更新との差分が残る。基本的に再マージ不要。 |
| `origin/feature/policies` | あり | policy 追加の古いブランチ。main より古く、`index.html` の footer などを戻す差分がある。再マージ不要。 |
| `origin/feature/redesign-dark` | あり | ダークテーマの古いブランチ。main の policy ページを削除する差分を含む。再マージ不可。 |
| `origin/feature/track-kakusei` | あり | local/startup 2票制トラック分岐、migration、`track-logic.js` などを追加。ただし main の `privacy.html` / `security.html` を削除する差分を含むため、そのままマージ不可。必要部分だけ再実装/移植候補。 |
| `origin/claude/revera-input-screen-2hlitj` | あり | 成長フェーズ定義パネルの古い Claude ブランチ。main に内容反映済みのため再マージ不要。 |
| `origin/claude/external-decision-criteria-uib555` | あり | `docs/外部基準依存の理解.md` と CSS 読みやすさ改善。REVERA01 関連の可能性あり。採否判断が必要。 |
| `origin/claude/ai-life-navigation-app-q1cfoe` | あり | Mira / life-navigator 系の別案。REVERA01 正典ではない。マージ非推奨。 |
| `origin/claude/ai-trust-neuroscience-posts-24xjnr` | あり | SNS 投稿自動化・カード生成系。REVERA01 本体ではない。マージ非推奨。 |
| `origin/claude/personal-values-philosophy-lquvgg` | あり | 価値観メモ系。REVERA01 本体ではない。マージ非推奨。 |

### 1.5 GitHub Pages

- 公開 URL: https://mika-fukuimodel.github.io/kakusei/
- メインアプリ: https://mika-fukuimodel.github.io/kakusei/index.html
- プライバシーポリシー: https://mika-fukuimodel.github.io/kakusei/privacy.html
- セキュリティポリシー: https://mika-fukuimodel.github.io/kakusei/security.html
- 公開元: GitHub Actions による Pages artifact。
- 対象ブランチ/ディレクトリ: `main` ブランチのリポジトリルート `.`。

## 2. Supabase 実スキーマ

### 2.1 確認方法と限界

公開済み publishable key で以下を確認した。

- `GET /rest/v1/programs?select=*&limit=1`
- `GET /rest/v1/participants?select=*&limit=1`
- `GET /rest/v1/events?select=*&limit=1`
- `GET /rest/v1/observations?select=*&limit=1`
- `GET /rest/v1/observations?select=<コードで使う全カラム>&limit=0`

結果:

- `programs`, `participants`, `events` は匿名ロールで `select` が `HTTP 200` となり、実データが返った。
- `observations` は匿名ロールで `select` が `HTTP 200`、現時点の応答は空配列 `[]`。コード参照カラムを指定した `limit=0` も `HTTP 200`。
- PostgREST OpenAPI root (`/rest/v1/`) は `Secret API key required` となり、publishable key では DB メタデータを取得できなかった。
- よって、型・NOT NULL・デフォルト・主キー・外部キーは、実データ、アプリコード、PostgREST の存在確認からの推定を含む。管理メタデータ未取得の項目は「未確認」と明記する。

Claude への注意:

- `service_role` key を要求しないこと。
- RLS の実ポリシー名や SQL 定義は、この資料作成時点では未確認。
- 匿名 `select` が実データを返す事実は確認済みであり、セキュリティ上の重要な検討対象。

### 2.2 `programs`

実データの `select=*` で存在確認済みのカラム:

| カラム | 型 | NOT NULL | デフォルト | 主キー | 外部キー | 根拠/メモ |
|---|---|---|---|---|---|---|
| `id` | uuid 推定 | 未確認 | uuid 自動生成推定 | 主キー推定 | - | 実データで UUID。 |
| `name` | text 推定 | 未確認 | 未確認 | - | - | コードで `.eq('name', programName)`。 |
| `type` | text 推定 | 未確認 | 未確認 | - | - | 新規作成時に `研究参加` / `研究支援`。 |
| `location` | text 推定 | 未確認 | 未確認 | - | - | 新規作成時に `全国`。 |
| `started_at` | date/timestamptz 推定 | 未確認 | `null` 可 | - | - | 実データで `null`。 |
| `ended_at` | date/timestamptz 推定 | 未確認 | `null` 可 | - | - | 実データで `null`。 |
| `director_note` | text 推定 | 未確認 | `null` 可 | - | - | 実データで `null`。 |
| `created_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | 実データで ISO timestamp。 |
| `updated_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | 実データで ISO timestamp。 |

RLS/匿名ロール:

- 匿名 `select`: 可能。`HTTP 200` で実データが返る。
- 匿名 `insert/update/delete`: 未確認。ライブ DB を汚さないため mutation は実施していない。
- RLS 有効/無効: 未確認。メタデータ取得には secret key が必要だった。

### 2.3 `participants`

実データの `select=*` で存在確認済みのカラム:

| カラム | 型 | NOT NULL | デフォルト | 主キー | 外部キー | 根拠/メモ |
|---|---|---|---|---|---|---|
| `id` | uuid 推定 | 未確認 | uuid 自動生成推定 | 主キー推定 | - | 実データで UUID。 |
| `program_id` | uuid 推定 | 未確認 | 未確認 | - | `programs.id` 推定 | コードで program id を保存。 |
| `code` | text 推定 | 未確認 | 未確認 | - | - | `U001` 形式。ログイン照合に使用。 |
| `nickname` | text 推定 | 未確認 | 未確認 | - | - | 新規登録フォーム。実名必須化しないこと。 |
| `joined_at` | date 推定 | 未確認 | 未確認 | - | - | コードでは `YYYY-MM-DD`。 |
| `current_stage` | integer 推定 | 未確認 | 未確認 | - | - | 1-7。七段階ステージ。 |
| `is_active` | boolean 推定 | 未確認 | 未確認 | - | - | ログイン時 `.eq('is_active', true)`。 |
| `supporter_note` | text 推定 | 未確認 | `null` 可 | - | - | 現状メールアドレス等の保存先に使われている。設計見直し候補。 |
| `prefecture` | text 推定 | 未確認 | `null` 可 | - | - | 新規登録フォームで都道府県。 |
| `created_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | 実データで ISO timestamp。 |
| `updated_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | 実データで ISO timestamp。 |

RLS/匿名ロール:

- 匿名 `select`: 可能。`HTTP 200` で実データが返る。
- 匿名 `select` の範囲: 少なくとも `limit=1` で `code`, `nickname`, `supporter_note`, `prefecture` 等を含む行が返った。
- 匿名 `insert/update/delete`: 未確認。ライブ DB を汚さないため mutation は実施していない。
- RLS 有効/無効: 未確認。

重要リスク:

- 参加者テーブルが匿名 `select=*` で読める現状は、疑似匿名化・最小化の観点で要確認。
- `supporter_note` にメールアドレス相当の情報が入る設計は、匿名 `select` と組み合わさると特に危険。優先的に見直すこと。

### 2.4 `events`

実データの `select=*` で存在確認済みのカラム:

| カラム | 型 | NOT NULL | デフォルト | 主キー | 外部キー | 根拠/メモ |
|---|---|---|---|---|---|---|
| `id` | uuid 推定 | 未確認 | uuid 自動生成推定 | 主キー推定 | - | 実データで UUID。 |
| `participant_id` | uuid 推定 | 未確認 | 未確認 | - | `participants.id` 推定 | 参加者記録の紐付け。 |
| `stage` | integer 推定 | 未確認 | 未確認 | - | - | 1-7。 |
| `recorded_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | ディレクター画面で日時表示。 |
| `status_choice` | integer 推定 | 未確認 | `null` 可 | - | - | Q1 選択。 |
| `main_text` | text 推定 | 未確認 | `null` 可 | - | - | 自由記述。 |
| `branch_text` | text 推定 | 未確認 | `null` 可 | - | - | 分岐質問。 |
| `action_taken` | boolean 推定 | 未確認 | `null` 可 | - | - | ステージ5等。 |
| `action_text` | text 推定 | 未確認 | `null` 可 | - | - | 行動内容。 |
| `action_feeling` | integer/text 推定 | 未確認 | `null` 可 | - | - | コードでは選択値。 |
| `blocker_text` | text 推定 | 未確認 | `null` 可 | - | - | 阻害要因。 |
| `obstacle_text` | text 推定 | 未確認 | `null` 可 | - | - | 障害内容。 |
| `coping_choice` | integer 推定 | 未確認 | `null` 可 | - | - | 対処選択。 |
| `can_talk_now` | boolean 推定 | 未確認 | `null` 可 | - | - | 話せるか。 |
| `giving_text` | text 推定 | 未確認 | `null` 可 | - | - | 還元内容。 |
| `giving_feeling` | integer/text 推定 | 未確認 | `null` 可 | - | - | 還元時の感触。 |
| `next_giving_text` | text 推定 | 未確認 | `null` 可 | - | - | 次に渡したいもの。 |
| `ai_stage_suggestion` | 未確認 | 未確認 | `null` 可 | - | - | 実データで存在。現行 UI では未使用。 |
| `ai_emotion_tags` | 未確認 | 未確認 | `null` 可 | - | - | 実データで存在。現行 UI では未使用。 |
| `ai_transform_flag` | boolean 推定 | 未確認 | `null` 可 | - | - | 実データで存在。現行 UI では未使用。 |
| `ai_summary` | text 推定 | 未確認 | `null` 可 | - | - | 実データで存在。現行 UI では未使用。 |
| `created_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | 実データで ISO timestamp。 |
| `related_persons` | array/json/text 推定 | 未確認 | `null` 可 | - | - | コードには `relatedPersons` があるが、現行 `submitEvent()` payload には未投入。 |
| `body_state` | text 推定 | 未確認 | `null` 可 | - | - | UI には身体状態欄があるが、現行 `submitEvent()` payload には未投入。 |

RLS/匿名ロール:

- 匿名 `select`: 可能。`HTTP 200` で実データが返る。
- 匿名 `insert/update/delete`: 未確認。
- RLS 有効/無効: 未確認。

重要リスク:

- `events` は参加者の心身・感情に関する機微な自由記述を含むため、匿名 `select=*` が可能な現状は要確認。
- 参加者本人・支援者・ディレクターの権限境界を DB 側で再設計する優先度が高い。

### 2.5 `observations`

実データは空配列だったが、コード参照カラムを指定した `select=...&limit=0` が `HTTP 200` だったため、以下のカラムは存在確認済み。

| カラム | 型 | NOT NULL | デフォルト | 主キー | 外部キー | 根拠/メモ |
|---|---|---|---|---|---|---|
| `participant_id` | uuid 推定 | 未確認 | 未確認 | - | `participants.id` 推定 | 支援者観察の対象。 |
| `supporter_id` | text/uuid 推定 | 未確認 | 未確認 | - | 未確認 | 現行コードでは固定文字列 `'supporter'`。 |
| `supporter_utterance` | text 推定 | 未確認 | `null` 可 | - | - | 支援者がかけた言葉。 |
| `participant_response` | text 推定 | 未確認 | `null` 可 | - | - | 参加者の反応。 |
| `stage_before` | integer 推定 | 未確認 | `null` 可 | - | - | 関わり前ステージ。 |
| `stage_after` | integer 推定 | 未確認 | `null` 可 | - | - | 関わり後ステージ。 |
| `stage_changed` | boolean 推定 | 未確認 | `null` 可 | - | - | 前後ステージ差分。 |
| `action_triggered` | boolean 推定 | 未確認 | 未確認 | - | - | 行動が起きたか。 |
| `action_text` | text 推定 | 未確認 | `null` 可 | - | - | 行動内容。 |
| `emotion_tags` | array/json 推定 | 未確認 | `null` 可 | - | - | 複数タグ。 |
| `transform_flag` | boolean 推定 | 未確認 | 未確認 | - | - | 変容のきっかけ判定。 |
| `alert_needed` | boolean 推定 | 未確認 | 未確認 | - | - | アラート要否。 |
| `alert_reason` | text 推定 | 未確認 | `null` 可 | - | - | アラート理由。 |
| `note` | text 推定 | 未確認 | `null` 可 | - | - | 備考。 |
| `observed_at` | timestamptz 推定 | 未確認 | `now()` 推定 | - | - | ディレクター画面で日時表示。 |

RLS/匿名ロール:

- 匿名 `select`: `HTTP 200`。ただし応答は空配列であり、実データ可視範囲は未確認。
- 匿名 `insert/update/delete`: 未確認。
- RLS 有効/無効: 未確認。

### 2.6 RLS まとめ

| テーブル | RLS 有効/無効 | 匿名 select | 匿名 insert | 匿名 update | 匿名 delete | コメント |
|---|---|---|---|---|---|---|
| `programs` | 未確認 | 可能、実データあり | 未確認 | 未確認 | 未確認 | publishable key で 200。 |
| `participants` | 未確認 | 可能、実データあり | 未確認 | 未確認 | 未確認 | 機微情報・メール相当保存先との関係で要注意。 |
| `events` | 未確認 | 可能、実データあり | 未確認 | 未確認 | 未確認 | 心身・感情記録が含まれるため最優先リスク。 |
| `observations` | 未確認 | 可能、空配列 | 未確認 | 未確認 | 未確認 | 観察記録の実データ可視範囲は未確認。 |

平易な説明:

- 現在の公開キーだけで、少なくとも `programs`, `participants`, `events` はブラウザや curl から読める。
- これが意図した公開範囲か、RLS の設定漏れかは未確認。
- 次のセキュリティ改修では、まず Supabase 管理画面または SQL で RLS と policies を確認し、匿名ロールの `select` 範囲を最小化すること。

### 2.7 `supporter_note` にメールアドレスが入っている現状の是非

現状:

- 新規登録時、`createParticipant()` が `supporter_note: email` として保存している。
- フィールド名と用途が不一致。
- 匿名 `participants select=*` が可能な現状では、メールアドレス相当の情報が露出するリスクが高い。

判断:

- 短期: `supporter_note` 維持のまま UI 改修をする場合でも、匿名 `select` の制限を先に確認する。
- 中期: `email` 専用カラムまたは別テーブルへ移す。ただしマイグレーション、RLS、既存データ移行、コード再通知設計をセットで行う。
- 推奨: `participant_contact` のような別テーブルを作り、匿名ロールから読ませない。参加者コードログインに不要な個人連絡先は `participants` の一覧取得から分離する。

## 3. 環境・確認の前提

### 3.1 Claude の実行環境制約

Claude の作業環境は、Supabase CDN や Supabase REST に接続できないことがある。  
その場合、ログインや保存の実動作確認は Claude 側では完了できない。コードを無変更にしても、外部 CDN に接続できなければ `supabase` global が定義されず、画面の JS が動かない。

前提:

- Claude は静的ファイルの読解・編集・構文確認を行う。
- 実ブラウザでのログイン確認、Supabase への保存確認、RLS 確認はユーザーまたは Codex 側で行う。
- Claude は「未確認」を隠さない。接続不可の場合は報告に明記する。

### 3.2 ローカルパス

- REVERA01 本体: `/Users/gotoumika/Projects/kakusei`
- 日次検証/通知: `/Users/gotoumika/revera-daily`
- 日次検証 README: `/Users/gotoumika/revera-daily/README.md`
- 日次検証プロンプト: `/Users/gotoumika/revera-daily/daily_check_prompt.md`
- 秘匿値: `/Users/gotoumika/revera-daily/.env.notify`
  - 中身を読まない、貼らない、コミットしない。

### 3.3 `revera-daily/README.md` の要点

- 毎朝 6:00 に REVERA リポジトリ `mika-fukuimodel/kakusei` を検証し、結果を LINE 通知する。
- スケジューラは macOS `launchd`。
- 検証対象は `~/Projects/kakusei`。
- REVERA の芯は「七段階ステージ x 支援者観測」。
- `index.html` は Supabase 直結、`revera.html` は localStorage。
- 6月29日版「自己リフレクション x Level 0-3 x Ollama」は対案であり正典ではない。
- LINE 送信失敗時は macOS 通知とデスクトップ警告ファイルを出す。

### 3.4 `daily_check_prompt.md` の要点

- 日次検証の判断前提:
  - REVERA01 = 七段階ステージ x 支援者観測。
  - 役割は参加者/支援者/ディレクター。
  - 疑似匿名化、特に参加者コード方式を維持する。
  - 覚醒モデル関連の内容は内部限定。行政向け出力に含めない。
- 検証内容:
  - 直近 24h コミット。
  - 破壊的変更。
  - Supabase 接続/RLS 状態。
  - 未マージ feature ブランチ。
  - 200字以内の日本語要約。

## 4. 改修バックログ

### 【1】ディレクター画面の UUID 断片を参加者コード表示へ

目的:

- ディレクター画面の最近の記録、アラート、変容トリガーで `participant_id` の UUID 断片ではなく、参加者コードを表示する。
- 疑似匿名化の運用上、UUID より `U001` 等の参加者コードの方が人間に扱いやすい。

対象ファイル:

- `index.html`

変更方針:

- `loadDirectorData()` の Supabase query を見直す。
- `events` / `observations` 取得時に `participant_id` から `participants.code` へ変換する。
- Supabase の join が使えるなら `select('..., participants(code)')` を検討。
- RLS の都合で join が失敗する場合は、`participants` 一覧から `id -> code` map を作って表示する。
- 表示はコードのみ。ニックネームやメール相当情報を不用意に出さない。

受け入れ条件:

- `director2026` でログインし、最近の記録、アラート、変容トリガーの参加者欄が UUID 断片ではなく参加者コードになる。
- データがない場合の空表示が壊れない。
- `participants` タブの既存表示が壊れない。

非交渉との整合・リスク:

- 参加者コード方式を強化する改修。
- ただし `participants` の匿名読み取り範囲を広げてはいけない。RLS 確認とセットで扱う。

確認手順:

- ローカルで `director2026` ログイン。
- 実データがある環境で最近の記録欄を確認。
- ブラウザ console error がないことを確認。

### 【2】新規登録の「参加者/支援者」ボタン色を新テーマへ統一

目的:

- 新規登録フォームの参加者/支援者ボタンに残る旧テーマ色を、現行ダークテーマの design token に合わせる。

対象ファイル:

- `index.html`

変更方針:

- inline style の `rgba(200,191,170,...)`, `rgba(245,240,232,...)`, `rgba(184,134,11,...)` を CSS class に移す。
- `--bg-input`, `--border-input`, `--text-body`, `--text-sub`, `--accent-grad` 等を使う。
- `selectRegisterRole()` は class toggle 方式に寄せる。

受け入れ条件:

- 登録フォームで参加者/支援者を選ぶと、選択状態が現行テーマに合う。
- モバイル幅でもボタン文字が潰れない。
- ログイン/コード忘れ導線に影響しない。

非交渉との整合・リスク:

- 見た目のみの低リスク改修。
- 参加者コード、七段階、RLS に影響しない。

確認手順:

- ログイン画面で「新規登録」を開く。
- 参加者/支援者の選択状態を確認。
- `TEST1` ログインが引き続き動くことを確認。

### 【3】メールアドレス保存先の設計見直し

目的:

- 現在 `supporter_note` にメールアドレスを保存している設計を整理し、個人情報露出リスクを下げる。

対象ファイル:

- `index.html`
- 必要なら `migrations/*.sql` を新規追加。
- Supabase 管理画面/SQL。

変更方針:

- 短期案:
  - `supporter_note` 維持。ただし匿名 `select` で読めないよう RLS/ビュー/取得列を制限する。
  - アプリ側の `participants` 一覧取得を必要列だけに絞る。
- 中期案:
  - `participant_contacts` などの別テーブルを作成。
  - `participant_id`, `email`, `created_at`, `updated_at` を持たせる。
  - 匿名ロールから `select` 不可にする。
  - コード再通知や問い合わせ対応に必要な権限設計を別途行う。

受け入れ条件:

- 新規登録が壊れない。
- メールアドレス相当情報が匿名 `participants select=*` で返らない設計になる。
- 既存データの移行方針が明記される。

非交渉との整合・リスク:

- 疑似匿名化とデータ最小化に直結する重要改修。
- migration を伴う場合は rollback と手順書が必要。

確認手順:

- Supabase 管理画面または SQL で RLS/policy を確認。
- publishable key で `participants` を取得し、メール相当情報が返らないことを確認。
- 新規登録の保存結果を確認。

### 【4】コード再通知を自動メール送信にするか、フォーム受付のままにするか

目的:

- 「コードを忘れた方」導線を、本当にメール自動送信に進めるか、当面は問い合わせフォーム受付で運用するか決める。

対象ファイル:

- `index.html`
- 必要なら Supabase Edge Functions、外部メールサービス設定、またはドキュメント。

変更方針:

- 当面維持案:
  - 現状の「受付メッセージ + Google Form 導線」を維持。
  - 文言だけ分かりやすくする。
- 自動送信案:
  - フロントだけでメール送信しない。
  - Supabase Edge Functions 等の server-side endpoint を用意。
  - rate limit、本人確認、送信ログ、秘匿値管理を設計。
  - メールアドレス保存先見直しとセットで実施。

受け入れ条件:

- ユーザーがコードを忘れた時に次の行動が分かる。
- 秘匿値がフロントや GitHub に出ない。
- 自動送信を入れる場合、不正な総当たりやメール列挙を防ぐ。

非交渉との整合・リスク:

- メールは個人情報。参加者コード方式を壊さない。
- 実名/連絡先情報の収集を増やす場合は必須化しない。

確認手順:

- ログイン画面で「コードを忘れた方」を開く。
- 不正メール形式でエラー。
- 正しいメール形式で受付メッセージ。
- 自動送信案の場合は server-side のログと送信結果を確認。

### 【5】固定コード認証を維持するか、Supabase Auth へ移行するか

目的:

- `director2026` / `supporter2026` の固定コード認証を、本番運用に耐える方式へ見直すか判断する。

対象ファイル:

- `index.html`
- Supabase Auth 設定。
- 必要なら migration / policy。

変更方針:

- 短期:
  - 固定コード維持。ただし docs に「簡易認証」と明記。
  - ディレクター/支援者画面で取得する列を最小化。
- 中期:
  - Supabase Auth を導入。
  - 役割 claim または profiles table を設計。
  - RLS policy を Auth 前提に再作成。
  - 参加者コードログインを残すか、参加者も Auth 化するか分けて設計。

受け入れ条件:

- 既存の参加者コードログインが壊れない。
- 支援者/ディレクター権限が固定文字列だけに依存しない方向性が明確になる。
- RLS と UI の権限が一致する。

非交渉との整合・リスク:

- 参加者コード方式は維持。
- Auth 導入で実名/メール必須化に寄せない。
- RLS 設計を誤るとデータが読めなくなる/読めすぎるため、段階的に進める。

確認手順:

- 既存 `TEST1-TEST7`。
- 既存 `supporter2026` / `director2026` または新 Auth flow。
- publishable key での直接 REST アクセス範囲。

### 【6】`feature/track-kakusei` の差分を main に取り込むべきか

目的:

- local/startup 2票制トラック分岐の案を、REVERA01 正典に入れるか判断する。

対象ファイル/ブランチ:

- `origin/feature/track-kakusei`
- 追加候補:
  - `TRACK_BRANCHING.md`
  - `track-logic.js`
  - `track-logic.test.js`
  - `migrations/001_track_branching.sql`
  - `migrations/001_track_branching_rollback.sql`
  - `migrations/002_auth_hardening_PLAN.sql`

変更方針:

- そのまま merge しない。
- 理由: main の `privacy.html` / `security.html` を削除する差分を含む。
- 必要なロジックと migration だけを別ブランチで再適用する。
- 七段階ステージの正典と矛盾しないか確認する。

受け入れ条件:

- policy ページを消さない。
- `index.html` の現行ログイン/登録/TEST コードが壊れない。
- トラック分岐の意味が docs に説明される。
- migration の適用/rollback 手順がある。

非交渉との整合・リスク:

- 七段階ステージの置換ではなく、補助分類として扱うなら検討可。
- DB migration と RLS の影響が大きい。

確認手順:

- `git diff origin/main..origin/feature/track-kakusei` を読む。
- 必要ファイルだけ cherry-pick せず、手作業で main ベースに再実装する。
- `privacy.html` / `security.html` が残ることを確認。

### 【7】Supabase RLS と匿名 select 範囲の最小化

目的:

- 現在 publishable key で `programs`, `participants`, `events` の実データが読める状態を確認し、意図しない公開を止める。

対象:

- Supabase DB。
- 必要なら `migrations/*.sql`。
- `index.html` の取得列。

変更方針:

- まず Supabase 管理画面または SQL で RLS enabled と policy を取得する。
- 匿名ロールで必要な操作を整理:
  - 参加者ログイン: `participants.code` で自分を見つける必要がある。
  - 参加者記録: 自分の `events` insert が必要。
  - 支援者観察: 支援者認証が弱い現状では policy 設計に注意。
  - ディレクター: 本来は匿名ではなく管理権限が必要。
- UI が必要とする列だけ取得する。

受け入れ条件:

- publishable key の直接 REST で、機微な自由記述やメール相当情報が読めない。
- アプリの必要最低限の操作は維持される。
- policy SQL と rollback が docs に残る。

非交渉との整合・リスク:

- 最重要のセキュリティ改修。
- 誤るとアプリが動かなくなるため、段階的に検証する。

確認手順:

- publishable key で各テーブルを curl。
- ログイン、登録、記録、支援者保存、ディレクター表示を確認。
- RLS policy の SQL をレビュー。

## 5. 現状の動作確認ログ

### 5.1 ローカルブラウザ smoke test

実施日時: 2026-07-13 JST  
対象: `http://127.0.0.1:8765/index.html`  
起動コマンド:

```bash
cd /Users/gotoumika/Projects/kakusei
python3 -m http.server 8765 --bind 127.0.0.1
```

確認結果:

| 入力コード | 結果 | 期待挙動 |
|---|---|---|
| `TEST1` | OK。`PARTICIPANT`、ステージ一 `封鎖状態` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST2` | OK。`PARTICIPANT`、ステージ二 `信頼の構築` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST3` | OK。`PARTICIPANT`、ステージ三 `潜在意識の顕在化` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST4` | OK。`PARTICIPANT`、ステージ四 `主体の回復` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST5` | OK。`PARTICIPANT`、ステージ五 `小さな挑戦` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST6` | OK。`PARTICIPANT`、ステージ六 `障害の突破` 表示。 | DB 保存なしの参加者プレビュー。 |
| `TEST7` | OK。`PARTICIPANT`、ステージ七 `場の創造と還元` 表示。 | DB 保存なしの参加者プレビュー。 |
| `supporter2026` | OK。`SUPPORTER`、支援者画面、`観察を記録する` 表示。 | 支援者観察フォーム。 |
| `director2026` | OK。`DIRECTOR`、ディレクター画面、タブ `概要/参加者/アラート/変容トリガー` 表示。 | ディレクターダッシュボード。 |

ブラウザ console:

- smoke test 中の error/warn ログなし。

注意:

- この確認では画面遷移と表示のみ確認。
- ライブ DB への insert/update/delete は行っていない。
- `director2026` 画面のデータ取得は匿名 select で動く現状に依存している可能性がある。

### 5.2 Supabase REST 確認ログ要約

公開済み publishable key で確認:

| API | 結果 |
|---|---|
| `/rest/v1/` | `Secret API key required`。メタデータ取得不可。 |
| `/rest/v1/programs?select=*&limit=1` | `HTTP 200`。実データあり。 |
| `/rest/v1/participants?select=*&limit=1` | `HTTP 200`。実データあり。 |
| `/rest/v1/events?select=*&limit=1` | `HTTP 200`。実データあり。 |
| `/rest/v1/observations?select=*&limit=1` | `HTTP 200`。空配列。 |
| `/rest/v1/observations?select=<コード参照カラム>&limit=0` | `HTTP 200`。指定カラム存在確認。 |

## 6. Claude への依頼テンプレ

ユーザーは、以下のように一言で Claude に依頼できる。

### テンプレ 1: ディレクター画面の参加者コード表示

```text
docs/REVERA01_handoff.md のバックログ【1】を、非交渉要件を守って実装して。
```

### テンプレ 2: 登録ボタンのテーマ統一

```text
docs/REVERA01_handoff.md のバックログ【2】だけを実装して。見た目の改修に限定し、ログインやSupabase処理は変えないで。
```

### テンプレ 3: メール保存先の設計

```text
docs/REVERA01_handoff.md のバックログ【3】について、まず実装前の設計案とmigration案を出して。秘匿値は扱わないで。
```

### テンプレ 4: コード再通知

```text
docs/REVERA01_handoff.md のバックログ【4】を読んで、当面フォーム受付のまま改善する最小改修を実装して。
```

### テンプレ 5: 固定コード認証の見直し

```text
docs/REVERA01_handoff.md のバックログ【5】について、Supabase Auth移行の設計だけ作って。まだコードは変更しないで。
```

### テンプレ 6: track-kakusei の採否調査

```text
docs/REVERA01_handoff.md のバックログ【6】を調査して、feature/track-kakusei から取り込むべき差分と捨てるべき差分を一覧化して。
```

### テンプレ 7: RLS セキュリティ確認

```text
docs/REVERA01_handoff.md のバックログ【7】を進めたい。まずSupabaseのRLS現状確認手順と、匿名selectを最小化するSQL案を作って。
```

### テンプレ 8: 任意の小改修

```text
docs/REVERA01_handoff.md を読んで、非交渉要件を守ったうえで、今回の指示範囲だけを最小差分で実装して。作業後は変更ファイル、確認結果、未確認事項を報告して。
```

## 7. 作業後の報告フォーマット

Claude は作業完了時に以下で報告すること。

```text
【REVERA01 作業報告】
対象バックログ:
- ...

変更ファイル:
- ...

実施内容:
- ...

確認結果:
- TEST1-TEST7:
- supporter2026:
- director2026:
- privacy/security/contact:
- Supabase/RLS:

未確認事項:
- ...
```

## 8. Claude が迷った時の判断基準

- REVERA01 の正典に合うか。
- 七段階ステージを壊していないか。
- 参加者コード方式と疑似匿名化を強めているか、弱めていないか。
- 実名個人情報やメール相当情報の露出を増やしていないか。
- GitHub Pages の静的公開で動くか。
- Supabase の publishable key で読める範囲を広げていないか。
- policy ページと問い合わせ導線を壊していないか。
- 変更が大きすぎる場合は、実装前に設計案として止めているか。
