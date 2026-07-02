-- REVERA / kakusei  トラック分岐マイグレーション 001（2026-07-02）
-- 目的: 参加者を local / startup に後置き分類するための最小のデータ拡張。
--       七段階ステージ（変容の軸）はそのまま。track は事業方向性の軸で直交。
-- 特徴: すべて追加のみ（既存データ・既存カラムを壊さない）。冪等（再実行可）。
--       新カラム・新テーブルにも RLS を適用（RLS暫定ロックダウンv1と同じ方針＝匿名は SELECT/INSERT のみ）。
-- ロールバックは 001_track_branching_rollback.sql を参照。

-- 1) participants: 事業方向性トラック＋申告票の生回答
alter table public.participants
  add column if not exists track text not null default 'undecided'
    check (track in ('local','startup','undecided'));
alter table public.participants
  add column if not exists declared_q1 text
    check (declared_q1 in ('local','startup','unclear'));      -- Q1 顧客の所在
alter table public.participants
  add column if not exists declared_q2 text
    check (declared_q2 in ('local','startup','neutral'));      -- Q2 外部出資意向

-- 2) observations: 行動票（支援者観察による向き）。既定 neutral＝未選択でも安全
alter table public.observations
  add column if not exists orientation_tag text not null default 'neutral'
    check (orientation_tag in ('local','startup','neutral'));

-- 3) track_decisions: 判定履歴（転線KPI算出用）
create table if not exists public.track_decisions (
  id               uuid primary key default gen_random_uuid(),
  participant_code text not null,
  decided_at       timestamptz not null default now(),
  previous_track   text check (previous_track in ('local','startup','undecided')),
  new_track        text check (new_track in ('local','startup','undecided')),
  basis_declared   text check (basis_declared in ('local','startup','unclear')),
  basis_behavioral text check (basis_behavioral in ('local','startup','neutral')),
  method           text not null check (method in ('auto_agreed','facilitator_decision','transfer_request')),
  note             text
);
create index if not exists idx_track_decisions_code on public.track_decisions(participant_code);

-- 4) 新テーブルのRLS（暫定ロックダウン方針に準拠：匿名は SELECT/INSERT のみ、UPDATE/DELETE拒否）
--    ※支援者/ディレクターの認証必須化と読み取り限定は Auth本修正（別SQL 002）で置換予定。
alter table public.track_decisions enable row level security;
drop policy if exists anon_select_track_decisions on public.track_decisions;
drop policy if exists anon_insert_track_decisions on public.track_decisions;
create policy anon_select_track_decisions on public.track_decisions for select to anon using (true);
create policy anon_insert_track_decisions on public.track_decisions for insert to anon with check (true);

-- 確認用:
-- select column_name from information_schema.columns where table_name='participants' and column_name in ('track','declared_q1','declared_q2');
-- select column_name from information_schema.columns where table_name='observations' and column_name='orientation_tag';
-- select count(*) from public.track_decisions;
