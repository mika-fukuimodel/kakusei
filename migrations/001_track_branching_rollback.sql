-- REVERA / kakusei  マイグレーション001 ロールバック（2026-07-02）
-- 001_track_branching.sql を完全に取り消す。追加したカラム・テーブルのみ削除（既存データは無傷）。
--
-- ▼ 非破壊での動作確認方法（本番データを消さずに構文と実行可否を検証する）:
--   BEGIN;
--     <この下の DROP 群>
--   ROLLBACK;   -- ← COMMIT せず巻き戻す。エラーなく通れば「ロールバックSQLは有効」と確認できる。
--
-- ▼ 本当に取り消す場合は BEGIN/ROLLBACK を外して実行（または COMMIT）。

drop table if exists public.track_decisions cascade;

alter table public.observations  drop column if exists orientation_tag;

alter table public.participants   drop column if exists declared_q1;
alter table public.participants   drop column if exists declared_q2;
alter table public.participants   drop column if exists track;
