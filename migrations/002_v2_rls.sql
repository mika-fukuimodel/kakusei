-- ============================================================
-- REVERA01 v2 Phase 1-b: RLS ポリシー(default-deny の上に最小許可)
-- ============================================================
-- 前提: 001_v2_schema.sql 適用済み(RLS有効・ポリシー無し=全拒否の状態)。
-- 方針: docs/REVERA01_architecture_v2.md §6
--   - anon 向けポリシーは作らない(匿名は永続的に全拒否)
--   - participant: 自分の events と自分の profile のみ
--   - supporter/director: 同一プログラムの仮名データのみ
--   - observations は作成した支援者本人+同プログラムの director のみ閲覧
--     (参加者からは見えない: 決定事項)
-- ============================================================

begin;

-- ---------- 補助関数(RLS再帰を避けるため security definer) ----------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_program()
returns uuid language sql stable security definer set search_path = public as
$$ select program_id from public.profiles where id = auth.uid() $$;

revoke all on function public.my_role() from anon;
revoke all on function public.my_program() from anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.my_program() to authenticated;

-- ---------- profiles ----------
create policy profiles_self_select on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_staff_select on public.profiles
  for select to authenticated
  using (my_role() in ('supporter','director') and program_id = my_program());

-- 自己登録: 本人行のみ・director は不可(サーバ側でも遮断)
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role in ('participant','supporter'));

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- ※変更可能な列は 001 の列GRANT(nickname, prefecture)で制限済み

-- ---------- events ----------
create policy events_own_insert on public.events
  for insert to authenticated
  with check (participant_id = auth.uid() and my_role() = 'participant');

create policy events_own_select on public.events
  for select to authenticated
  using (participant_id = auth.uid());

create policy events_staff_select on public.events
  for select to authenticated
  using (
    my_role() in ('supporter','director')
    and exists (
      select 1 from public.profiles p
      where p.id = events.participant_id and p.program_id = my_program()
    )
  );

-- ---------- observations ----------
create policy obs_supporter_insert on public.observations
  for insert to authenticated
  with check (supporter_id = auth.uid() and my_role() in ('supporter','director'));

create policy obs_own_select on public.observations
  for select to authenticated
  using (supporter_id = auth.uid());

create policy obs_director_select on public.observations
  for select to authenticated
  using (
    my_role() = 'director'
    and exists (
      select 1 from public.profiles p
      where p.id = observations.participant_id and p.program_id = my_program()
    )
  );

-- ---------- programs ----------
create policy programs_member_select on public.programs
  for select to authenticated
  using (id = my_program());

commit;

-- ============================================================
-- 適用後の確認(実施はローカル/Supabaseから):
--   1) 匿名(apikeyのみ)で 4テーブル select → 全て空/拒否になること
--   2) participant でログイン → 自分の events だけ読める/書けること
--   3) supporter でログイン → 同プログラム profiles(仮名)と events が読め、
--      observations を自分名義で書けること
--   4) participant で observations を select → 0件であること
-- ============================================================
