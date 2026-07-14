# REVERA01 運用手順：ディレクター昇格

対象: REVERA01 v2（メールOTP認証）／ 作成: 2026-07-15

ディレクター（director）は自己登録できない設計です（RLSポリシー `profiles_self_insert` が participant/supporter のみ許可）。昇格は Supabase ダッシュボードの SQL Editor から運営者が行います。

## 前提

- 対象者が先にアプリ（https://mika-fukuimodel.github.io/kakusei/）でメールOTPログイン→自己登録を済ませていること（profiles に行ができている）。
- 操作者は Supabase ダッシュボード（org `tankyuu` / project `kakusei.ver0`）にログインできること。

## 手順

1. ブラウザで Supabase ダッシュボードを開く: https://supabase.com/dashboard/project/dteuzcpgjoluehfzbobn/sql/new
2. まず対象者の profiles 行を確認する（ニックネームか発行済みコードで特定）:

```sql
select id, role, code, nickname, created_at
from public.profiles
order by created_at desc
limit 20;
```

3. 対象者の `id` を控え、以下を実行する。`code` は D001 から連番で手動採番（既存の D コードを確認して重複しない番号にする）:

```sql
update public.profiles
set role = 'director', code = 'D001'
where id = '対象者のUUID';
```

4. 確認:

```sql
select id, role, code from public.profiles where role = 'director';
```

5. 対象者にアプリを再読み込み（またはログインし直し）してもらう。ディレクター画面が表示されれば完了。

## 降格（取り消し）

```sql
update public.profiles
set role = 'supporter', code = 'S0XX'  -- 既存Sコードと重複しない番号
where id = '対象者のUUID';
```

## 注意

- `where id = ...` を付け忘れると全行が更新される。実行前に必ず select で対象1行を確認する。
- ディレクターは同一プログラム内の仮名データ（コード・記録・観察）を閲覧できる強い権限。付与は最小限に。
- この操作はダッシュボードで完結する。service_role キーや Edge Function は不要（設計書 §7 の改定参照）。
