-- ============================================================
-- REVERA01 Phase 0 ロールバック(原則使用しない)
-- ============================================================
-- 警告:
--   これは「匿名で実データが読める」旧・露出状態に戻すもの。
--   実行する正当な理由は基本的に無い。緊急でアプリを一時復旧させる
--   必要がある場合のみ、期間を区切って使用し、速やかに再封鎖すること。
-- ============================================================

begin;

-- anon / authenticated へ最低限の権限を戻す(旧アプリの動作範囲)
grant select, insert on table public.programs      to anon;
grant select, insert on table public.participants  to anon;
grant select, insert on table public.events        to anon;
grant select, insert on table public.observations  to anon;

-- RLS ポリシー: 旧状態が「RLS無効 or permissive」だったため、
-- 同等の permissive ポリシーを付与(= 実質開放。危険)
create policy p0_rb_programs_all      on public.programs      for all to anon using (true) with check (true);
create policy p0_rb_participants_all  on public.participants  for all to anon using (true) with check (true);
create policy p0_rb_events_all        on public.events        for all to anon using (true) with check (true);
create policy p0_rb_observations_all  on public.observations  for all to anon using (true) with check (true);

commit;

-- 再封鎖するには 000_phase0_deny_all.sql を再実行。
