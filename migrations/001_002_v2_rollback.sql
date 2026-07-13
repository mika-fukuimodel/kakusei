-- ============================================================
-- REVERA01 v2 ロールバック(001 + 002 をまとめて撤去)
-- ============================================================
-- 注意:
--   - v2 スキーマとポリシーを削除する。v2 で保存したデータは失われる。
--   - 旧(v1)テーブルは 001 で drop 済みのため、ここでは「復元されない」。
--     v1 に戻すにはバックアップからの復元が必要(本番データ無し前提なら不要)。
-- ============================================================

begin;

-- ポリシー(002)
drop policy if exists profiles_self_select   on public.profiles;
drop policy if exists profiles_staff_select  on public.profiles;
drop policy if exists profiles_self_insert   on public.profiles;
drop policy if exists profiles_self_update   on public.profiles;
drop policy if exists events_own_insert      on public.events;
drop policy if exists events_own_select      on public.events;
drop policy if exists events_staff_select    on public.events;
drop policy if exists obs_supporter_insert   on public.observations;
drop policy if exists obs_own_select         on public.observations;
drop policy if exists obs_director_select    on public.observations;
drop policy if exists programs_member_select on public.programs;

drop function if exists public.my_role();
drop function if exists public.my_program();

-- スキーマ(001)
drop table if exists public.observations cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop table if exists public.programs cascade;
drop function if exists public.assign_profile_code();
drop function if exists public.touch_updated_at();
drop sequence if exists public.participant_code_seq;
drop sequence if exists public.supporter_code_seq;

commit;
