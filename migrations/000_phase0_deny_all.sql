-- ============================================================
-- REVERA01 Phase 0: 匿名アクセスの緊急遮断(deny-all RLS)
-- ============================================================
-- 目的:
--   匿名(anon / publishable key)で participants / events 等の実データが
--   読める状態を即時に止める。本番ユーザーデータ投入前の緊急封鎖。
--
-- 前提・影響(既知・合意済み):
--   - 現行 index.html は全操作を anon で行っているため、これを実行すると
--     現行アプリの DB 機能(ログイン照合・登録・記録保存・ディレクター画面)は
--     すべて停止する。v2(メールOTP + 新スキーマ)で再構築する。
--   - GitHub Pages の静的配信・privacy/security ページは影響を受けない。
--
-- 実行方法:
--   Supabase Dashboard → SQL Editor でレビューの上、実行。
--   ロールバックは 000_phase0_deny_all_rollback.sql(ただし旧・露出状態に
--   戻るだけなので、原則使わない)。
-- ============================================================

begin;

-- 1) RLS を有効化(既に有効でもエラーにならない)
alter table if exists public.programs      enable row level security;
alter table if exists public.participants  enable row level security;
alter table if exists public.events        enable row level security;
alter table if exists public.observations  enable row level security;

-- 2) FORCE: テーブル所有者にも RLS を適用(所有者経由のすり抜け防止)
alter table if exists public.programs      force row level security;
alter table if exists public.participants  force row level security;
alter table if exists public.events        force row level security;
alter table if exists public.observations  force row level security;

-- 3) 既存ポリシーを全て削除(permissive な旧ポリシーの残置を防ぐ)
--    ※ポリシー名が不明でも全部落とせるよう DO ブロックで動的に削除
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('programs','participants','events','observations')
  loop
    execute format('drop policy %I on %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 4) anon / authenticated のテーブル権限を剥奪
--    (RLS はポリシーが無ければ deny だが、GRANT も最小化して二重に守る)
revoke all on table public.programs      from anon, authenticated;
revoke all on table public.participants  from anon, authenticated;
revoke all on table public.events        from anon, authenticated;
revoke all on table public.observations  from anon, authenticated;

-- 5) 念のため: 将来作られるテーブルへの既定権限も anon には与えない
alter default privileges in schema public revoke all on tables from anon;

commit;

-- ============================================================
-- 実行後の確認(publishable key で。全て 401/403 または空になること):
--   curl -s "https://dteuzcpgjoluehfzbobn.supabase.co/rest/v1/programs?select=*&limit=1" \
--     -H "apikey: <publishable_key>"
--   curl -s ".../rest/v1/participants?select=*&limit=1" -H "apikey: <publishable_key>"
--   curl -s ".../rest/v1/events?select=*&limit=1"        -H "apikey: <publishable_key>"
--   curl -s ".../rest/v1/observations?select=*&limit=1"  -H "apikey: <publishable_key>"
-- 期待: HTTP 200 + 実データ が返らないこと(permission denied / 空)。
-- ============================================================
