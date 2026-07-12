# REVERA01 アーキテクチャ v2 設計書 ―― 根本要因の全廃

- 作成: 2026-07-12 / 対象: REVERA01 / kakusei
- 位置づけ: 本番ユーザーデータが無い今のうちに、**土台から作り直して根本要因を消す**ための設計。
  実装前レビュー用。合意後にフェーズ実装へ。
- 前提資料: `docs/REVERA01_handoff.md`(現行の穴・非交渉要件・匿名アクセスの実測)
- 決定事項: **認証方式 = メールOTP(Supabase Auth)**、進め方 = 設計書先行。

---

## 0. 非交渉要件(v2でも不変）

- **七段階ステージ**(名称・順序): 1 封鎖状態 / 2 信頼の構築 / 3 潜在意識の顕在化 / 4 主体の回復 / 5 小さな挑戦 / 6 障害の突破 / 7 場の創造と還元。Level 0-3 へ置換しない。
- **仮名運用**: 参加者は**コード(U001等)で識別**。実名・住所・電話を必須にしない。
  - メールは「**認証チャネル**」としてのみ使用し、公開テーブルには置かない(後述: `auth.users` に隔離)。
- **静的HTML + GitHub Pages** を維持(ビルド工程を必須化しない)。
- **privacy.html / security.html** を維持・整合(運営者 Mika Goto、問い合わせフォーム導線)。
- **RLSを弱めない**。匿名で機微データを読ませない。

---

## 1. 現行の根本要因 → v2での根本対策

| # | 根本要因 | v2 での根本対策 |
|---|---|---|
| 1 | 固定コードが JS 内 → Supabaseから見ると全員 `anon`、役割判定不能 | **Supabase Auth(メールOTP)**。認証で本物の `auth.uid()` を持つ。役割は `profiles.role` |
| 2 | RLS 実質無効 → 匿名で機微データが読める | **全テーブル default-deny の RLS**。`auth.uid()`＋役割＋プログラムで最小権限のみ |
| 3 | PII(メール)が公開テーブル `supporter_note` に混入 | PIIは **`auth.users`(Supabase管理・保護)**へ。公開 `profiles` は**仮名のみ** |
| 4 | 秘匿値をクライアントに置けない/コード再通知が作れない | 特権処理は **Edge Function(サーバ側 service_role)**。クライアントに秘匿値ゼロ |
| 5 | `innerHTML` に生ユーザ文字列 → XSS | 描画を `textContent` / 明示的DOM生成へ。ユーザ文字列は挿入前にエスケープ |
| 6 | 単一巨大 `index.html`・マイグレーション無し | スキーマは `migrations/` で管理(適用+ロールバック)。フロントは責務分割(静的のまま) |

---

## 2. 目標アーキテクチャ全体像

```
[ブラウザ / 静的HTML(GitHub Pages)]
   │  Supabase JS SDK(publishable key のみ)
   │
   ├─ 認証: メールOTP(supabase.auth.signInWithOtp)
   │        └─ email は auth.users に格納(公開スキーマには出さない)
   │
   ├─ データ: PostgREST 経由。全アクセスは RLS で auth.uid()＋role＋program に制限
   │
   └─ 特権処理: Edge Functions(service_role)
             ├─ 招待/コード発行(participant slot 作成)
             ├─ コード再通知メール(enumeration防止・レート制限)
             └─ 管理系(必要時)
```

- クライアントが持つのは **publishable(anon)key のみ**。これは既に公開前提。
- `anon` ロールには**いかなる機微テーブルへの読み書き権限も与えない**(RLSポリシーを作らない=拒否)。
- 認証済み(`authenticated`)ユーザーだけが、自分の役割・プログラムの範囲でアクセス。

---

## 3. 認証と「仮名の両立」

メールOTPを使いつつ、**公開データは仮名のまま**にする設計:

1. サインイン: `supabase.auth.signInWithOtp({ email })` → メールのワンタイムコード/リンクで認証。
2. 認証成功で `auth.users`(Supabase管理)に uid が紐づく。**email はここだけに存在**(RLSで保護、公開スキーマからは参照しない)。
3. 公開 `profiles` は uid をキーに、**仮名情報(コード・ステージ等)のみ**保持。実名は保持しない。
4. 画面表示・ディレクター一覧・変容トリガーは、すべて `profiles.code` 等の**仮名で表示**。

> ポイント: 「メールを使う」ことと「実名運用にする」ことは別。メールは本人到達のための認証チャネルで、`auth.users` に隔離。プロフィールは仮名。これで非交渉(仮名運用)を守りつつ、匿名アクセスと役割詐称を同時に潰せる。

### 参加者の登録(2案・要決定)
- **(推奨) 招待型**: 支援者/ディレクターが参加者スロット(コード)を先に作り、メール招待。参加者はOTPでサインインして紐づく。参加者は実名を一切入力しない。最も安全で仮名性が高い。
- **(代替) 自己登録型**: 参加者がメール＋プログラムコードでサインアップ。摩擦は低いが、悪用・列挙対策を要する。

---

## 4. 役割モデルとアクセス範囲

| 役割 | 認証 | 見える/できること |
|---|---|---|
| participant | メールOTP | 自分の `events` の作成・閲覧、自分の `profile`。他者データは不可 |
| supporter | メールOTP | 自分の担当プログラムの参加者(仮名)と `events` 閲覧、`observations` 作成 |
| director | メールOTP | 自分のプログラムの集計・一覧・アラート・変容トリガー(仮名) |

- スコープは当面 **プログラム単位**(`program_id`)。将来、支援者↔参加者の個別割当が必要なら `assignments` テーブルを追加(§5 末尾)。

---

## 5. 新データモデル(スキーマ草案)

> データが無いので**クリーン構築**。以下は `migrations/001_v2_schema.sql` 想定の草案。型・制約は Supabase SQL Editor でレビューして確定。

```sql
-- programs
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profiles: auth.users と 1:1。仮名情報のみ。email は保持しない。
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('participant','supporter','director')),
  code text unique,                       -- 仮名(U001 等)。participant は必須運用
  nickname text,
  prefecture text,
  program_id uuid references public.programs(id),
  current_stage int check (current_stage between 1 and 7),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- events: 参加者の自己記録
create table public.events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  stage int not null check (stage between 1 and 7),
  status_choice int,
  main_text text,          -- 自由記述(最重要保護)
  branch_text text,
  action_taken boolean,
  action_text text,
  action_feeling int,
  blocker_text text,
  obstacle_text text,
  coping_choice int,
  can_talk_now boolean,
  giving_text text,
  giving_feeling int,
  next_giving_text text,
  related_persons jsonb,    -- 現行UIにあるが未保存だった項目を正式化
  body_state text,          -- 同上
  recorded_at timestamptz default now()
);

-- observations: 支援者の観察記録(supporter_id は本物の uid)
create table public.observations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  supporter_id uuid not null references public.profiles(id),
  supporter_utterance text,
  participant_response text,
  stage_before int check (stage_before between 1 and 7),
  stage_after int check (stage_after between 1 and 7),
  stage_changed boolean,
  action_triggered boolean,
  action_text text,
  emotion_tags jsonb,
  transform_flag boolean,
  alert_needed boolean default false,
  alert_reason text,
  note text,
  observed_at timestamptz default now()
);

-- (将来) 支援者↔参加者の個別割当が必要になったら
-- create table public.assignments (
--   supporter_id uuid references public.profiles(id),
--   participant_id uuid references public.profiles(id),
--   primary key (supporter_id, participant_id)
-- );
```

**現行からの変更点(重要)**
- `participants` → `profiles`(auth連携・役割統合)。`supporter_note`(=メール置き場)は**廃止**。
- `events.participant_id` / `observations.*_id` は `profiles.id`(= `auth.uid()`)を指す。
- `related_persons` / `body_state` を正式カラム化(現行は入力UIがあるのに未保存)。
- 未使用の `ai_*` 列は v2 では持ち越さない(必要になった時点で追加)。

---

## 6. RLS 方針(default-deny)

全テーブルで `enable row level security`。**anon にはポリシーを与えない=全拒否**。以下は `migrations/002_v2_rls.sql` 草案。

```sql
alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.observations  enable row level security;
alter table public.programs      enable row level security;

-- 補助: 現在ユーザーの role / program
create or replace function public.my_role() returns text
  language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_program() returns uuid
  language sql stable security definer set search_path = public as
$$ select program_id from public.profiles where id = auth.uid() $$;

-- profiles: 本人は自分を、支援者/ディレクターは同一プログラムを閲覧
create policy profiles_self_select on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_program_select on public.profiles
  for select to authenticated using (
    my_role() in ('supporter','director') and program_id = my_program()
  );
create policy profiles_self_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update to authenticated using (id = auth.uid());

-- events: 参加者は自分の記録のみ作成・閲覧。支援者/ディレクターは同一プログラムを閲覧
create policy events_owner_all on public.events
  for all to authenticated
  using (participant_id = auth.uid())
  with check (participant_id = auth.uid() and my_role() = 'participant');
create policy events_program_select on public.events
  for select to authenticated using (
    my_role() in ('supporter','director')
    and participant_id in (select id from public.profiles where program_id = my_program())
  );

-- observations: 支援者は自分の観察を作成。閲覧は作成者本人＋同プログラムのディレクター
create policy obs_supporter_insert on public.observations
  for insert to authenticated
  with check (supporter_id = auth.uid() and my_role() in ('supporter','director'));
create policy obs_supporter_select on public.observations
  for select to authenticated using (supporter_id = auth.uid());
create policy obs_director_select on public.observations
  for select to authenticated using (
    my_role() = 'director'
    and participant_id in (select id from public.profiles where program_id = my_program())
  );

-- programs: 同一プログラムの認証ユーザーが閲覧。作成/更新は Edge Function 側で
create policy programs_member_select on public.programs
  for select to authenticated using (id = my_program());
```

- **anon**: 上記に `to anon` のポリシーは一切無い → **匿名では全テーブル読めない/書けない**(根本要因#2の解消)。
- 参加者は「自分の `events`」だけ。支援者/ディレクターは「自分のプログラムの仮名データ」だけ。**全件横断は不可**。
- 参加者は支援者の生の `observations` を見られない(閲覧は支援者本人＋ディレクター)。

---

## 7. Edge Functions(サーバ側特権処理)

クライアントに秘匿値を置かないための境界。`supabase/functions/` 想定。

- `invite-participant`: ディレクター/支援者がスロット(コード)発行＋招待メール。service_role で `profiles` 作成。
- `recover-code`: メールを受け、登録があってもなくても**同一応答**(存在を漏らさない)。レート制限。実際の再通知はメールで。
- （必要時）`admin-*`: 集計・エクスポート等。
- 原則: **service_role キーは Edge Function 内のみ**。クライアント・リポジトリには置かない。`.env.notify` 等の秘匿値は不読・不出力・不コミット。

---

## 8. フロントエンド方針(静的のまま作り直す)

- **静的HTML + GitHub Pages を維持**。ビルド必須化しない(必要になれば別途合意)。
- 認証配線: `supabase.auth`(OTP送信→検証→セッション保持)。役割で画面出し分け。固定コード分岐(`director2026` 等)は**撤去**。
- **XSS一掃**: テーブル/一覧の `innerHTML` を、`textContent` もしくは要素生成＋属性設定に置換。ユーザ由来文字列は必ずエスケープ。
- 責務分割(任意): `auth.js` / `participant.js` / `supporter.js` / `director.js` / `styles.css`。ただし Pages の相対パスを壊さない。v1 のダーク配色・七段階カラー・可読性改善(既存 CSS)は流用。
- `TEST1〜7` 相当のプレビューは、DB非依存の「デモモード」として維持可(本番認証とは分離)。

---

## 9. privacy / security 文書の更新点

- privacy: **メールを認証目的で取得・処理**する旨を正確に記載(保管場所=Supabase Auth、用途=本人到達/ログイン、実名は取得しない)。データ最小化・保持/削除方針を追記。
- security: 認証(メールOTP)、RLSによる役割別アクセス制御、Edge Function境界、匿名アクセス遮断を明記。仮名運用・役割分離は維持。
- 運営者 Mika Goto・問い合わせフォーム導線は維持。

---

## 10. フェーズ計画(3 / 5 / 12ヶ月)

| Phase | 目安 | 内容 | 完了の目印 |
|---|---|---|---|
| **0** | 即・数日 | データ無いうちに漏洩経路を封鎖。全テーブル deny-all RLS。現行固定コード導線は「準備中」表示 | 匿名RESTで4テーブルとも読めない |
| **1** | 〜1ヶ月 | 新スキーマ＋Auth(OTP)＋default-deny RLS＋役割/プログラム、Edge Function雛形、フロントAuth配線、XSS一掃 | 参加者がOTPでログイン→自分の記録のみ作成/閲覧 |
| **2** | 〜3ヶ月 | 支援者/ディレクターの正規アクセス、担当割当、ディレクター画面をRLS越しで(コード表示)、コード再通知メール、ポリシー更新 | 役割別に自分の範囲だけ見える。director/supporter が正規認証 |
| **3** | 〜5ヶ月 | データライフサイクル(保持期間・エクスポート・削除権)、監査ログ、同意記録、レート制限、監視をrevera-daily連携 | 削除/エクスポート導線と監査ログが動作 |
| **4** | 〜12ヶ月 | 運用成熟(バックアップ、移行規律、清潔な土台でtrack再検討、privacy配慮の分析、正式セキュリティレビュー) | 外部レビュー通過 |

> 既存バックログ(handoff の B01〜B07)は v2 で再位置づけ: B03/B07 は Phase 0-1 に吸収、B01/B02 は Phase 1-2 のUI仕上げ、B04 は Phase 2(Edge Function)、B05 は本設計そのもの、B06 は Phase 4。

---

## 11. 受け入れ条件(v2 全体）

- 匿名(anon)REST で `programs/participants(profiles)/events/observations` の**いずれも読めない**。
- 参加者は**自分の記録だけ**作成・閲覧できる。他参加者のデータに到達不能。
- 支援者/ディレクターは**自分のプログラムの仮名データだけ**閲覧。全件横断不可。
- 公開スキーマに**メール等PIIが存在しない**(auth.users のみ)。
- 七段階(名称・順序)維持。実名を必須化していない。
- 静的HTML + GitHub Pages で動作。privacy/security/問い合わせ導線が生きている。
- クライアント/リポジトリに秘匿値が無い。

---

## 12. リスク・未決事項

- **UX摩擦**: OTPログインは固定コードより一手間。→ セッション永続＋「招待型」で緩和。要UX確認。
- **登録方式**: 招待型 vs 自己登録型(§3)。→ 要決定(推奨: 招待型)。
- **参加者による自己観察の可視範囲**: 参加者は支援者の生observationを見ない前提。→ 要確認。
- **メール送信基盤**: Supabase 標準メール or 外部(SendGrid等)。→ Phase 2 で決定。秘匿値は Edge Function に隔離。
- **デモ/プレビュー(TEST1〜7)**: 本番認証と分離した「デモモード」で維持するか。→ 要確認。
- RLSポリシーSQLは**草案**。Supabase 上で `explain`/実アクセステスト後に確定。

---

### 次アクション(合意後)
1. §12 の未決(登録方式・可視範囲・デモ扱い)を確定。
2. Phase 0 の deny-all RLS を適用(漏洩即封鎖)。
3. Phase 1 実装(スキーマ→RLS→Auth配線→XSS)。migrations と rollback を同梱。
