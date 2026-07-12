-- ============================================================
-- REVERA01 v2 Phase 1-a: 新スキーマ構築
-- ============================================================
-- 前提:
--   - 本番ユーザーデータは存在しない(2026-07 確認済み)。旧テーブルは破棄する。
--   - 000_phase0_deny_all.sql 適用済みでも未適用でも実行可。
--   - 実行後、テーブルは RLS 有効(ポリシー無し=全拒否)。
--     アクセスを開けるのは 002_v2_rls.sql。順番に実行すること。
-- 設計: docs/REVERA01_architecture_v2.md §5
-- ============================================================

begin;

-- ---------- 0) 旧スキーマ撤去(データ無し確認済みの前提) ----------
drop table if exists public.observations cascade;
drop table if exists public.events cascade;
drop table if exists public.participants cascade;
drop table if exists public.programs cascade;

create extension if not exists pgcrypto;

-- ---------- 1) programs ----------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 既定プログラム(自己登録者は全員ここに所属。固定UUIDで参照可能に)
insert into public.programs (id, name, type, location)
values ('00000000-0000-0000-0000-000000000001', 'REVERA01', '研究', '全国');

-- ---------- 2) profiles(auth.users と 1:1。仮名のみ・メールは持たない) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('participant','supporter','director')),
  code text unique,                -- 仮名コード(U001/S001)。トリガーで自動採番
  nickname text,
  prefecture text,
  program_id uuid not null default '00000000-0000-0000-0000-000000000001'
    references public.programs(id),
  current_stage int not null default 1 check (current_stage between 1 and 7),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- コード自動採番(クライアントからの指定は受け付けない: 列GRANTからも除外)
create sequence public.participant_code_seq;
create sequence public.supporter_code_seq;

create or replace function public.assign_profile_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'participant' then
    new.code := 'U' || lpad(nextval('public.participant_code_seq')::text, 3, '0');
  elsif new.role = 'supporter' then
    new.code := 'S' || lpad(nextval('public.supporter_code_seq')::text, 3, '0');
  end if;
  -- director はダッシュボード/管理側で作成・採番する
  return new;
end;
$$;

create trigger trg_assign_profile_code
before insert on public.profiles
for each row execute function public.assign_profile_code();

-- updated_at 自動更新
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger trg_programs_touch before update on public.programs
for each row execute function public.touch_updated_at();

-- ---------- 3) events(参加者の自己記録) ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles(id) on delete cascade,
  stage int not null check (stage between 1 and 7),
  status_choice int,
  main_text text,
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
  related_persons jsonb,
  body_state text,
  recorded_at timestamptz not null default now()
);

create index idx_events_participant on public.events (participant_id, recorded_at desc);

-- ---------- 4) observations(支援者の観察記録) ----------
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
  alert_needed boolean not null default false,
  alert_reason text,
  note text,
  observed_at timestamptz not null default now()
);

create index idx_obs_participant on public.observations (participant_id, observed_at desc);
create index idx_obs_alert on public.observations (alert_needed) where alert_needed;
create index idx_obs_transform on public.observations (transform_flag) where transform_flag;

-- ---------- 5) RLS 有効化(ポリシー無し=全拒否。開放は 002 で) ----------
alter table public.programs      enable row level security;
alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.observations  enable row level security;
alter table public.programs      force row level security;
alter table public.profiles      force row level security;
alter table public.events        force row level security;
alter table public.observations  force row level security;

-- ---------- 6) 権限(最小化) ----------
-- anon には一切与えない
revoke all on table public.programs, public.profiles, public.events, public.observations from anon;
revoke all on sequence public.participant_code_seq, public.supporter_code_seq from anon, authenticated;

-- authenticated は必要最小限の列だけ
revoke all on table public.programs, public.profiles, public.events, public.observations from authenticated;
grant select on table public.programs to authenticated;
grant select on table public.profiles to authenticated;
-- insert: code / current_stage / is_active / program_id は指定不可(既定値+トリガー)
grant insert (id, role, nickname, prefecture) on table public.profiles to authenticated;
-- update: 本人の表示情報のみ(ステージ変更等は当面ダッシュボード/Edge Function で)
grant update (nickname, prefecture) on table public.profiles to authenticated;
grant select, insert on table public.events to authenticated;
grant select, insert on table public.observations to authenticated;

-- 将来テーブルの既定権限からも anon を外す(冪等)
alter default privileges in schema public revoke all on tables from anon;

commit;

-- 運用メモ:
--   * director の作成: Supabase Dashboard で該当ユーザーの profiles.role を
--     'director' に更新し、code を 'D001' 等で手動設定する(自己登録では不可)。
--   * 参加者の current_stage の昇段も当面 Dashboard で更新(Phase 2 で正規導線)。
