# REVERA01 引き継ぎパケット（Claude 用）

このファイルは REVERA01 / kakusei を安全に保守するための単一の情報源です。
Claude はまずこのファイルを読み、依頼された backlog 項目**だけ**を、
non_negotiables を守って最小差分で実装します。

- 依頼例: 「`docs/REVERA01_handoff.md` の `backlog.B01` を、非交渉要件を守って実装して」
- 秘匿値（`.env.notify` / service_role キー / LINE トークン等）は読まない・出さない・コミットしない
- Supabase/CDN に到達できない環境では「未確認」と報告し、推測で成功と言わない

```yaml
schema: revera01_handoff.v2
format: markdown_with_yaml_packet
created_at_jst: "2026-07-13"
intended_reader: "Claude / Claude Code"
purpose: >
  This is the single source of truth for safe REVERA01 / kakusei maintenance.
  Claude should read this file first, then implement only the requested backlog item
  while preserving all non-negotiable constraints.

how_to_use:
  minimum_user_prompt_examples:
    - "docs/REVERA01_handoff.md の backlog.B01 を、非交渉要件を守って実装して"
    - "docs/REVERA01_handoff.md の backlog.B02 だけ実装して。Supabase処理は変えないで"
    - "docs/REVERA01_handoff.md を読んで、今回の指示範囲だけ最小差分で直して"
  required_claude_behavior:
    - "Read this entire packet before editing."
    - "Do not request or expose secrets."
    - "Do not broaden personal-data collection."
    - "If Supabase/CDN access is unavailable, report it as unverified instead of guessing."
    - "After work, report changed files, verification results, and remaining unknowns."

repository:
  name: "REVERA01 / kakusei"
  url: "https://github.com/mika-fukuimodel/kakusei"
  local_path: "/Users/gotoumika/Projects/kakusei"
  target_branch: "main"
  pages:
    public_url: "https://mika-fukuimodel.github.io/kakusei/"
    app_url: "https://mika-fukuimodel.github.io/kakusei/index.html"
    privacy_url: "https://mika-fukuimodel.github.io/kakusei/privacy.html"
    security_url: "https://mika-fukuimodel.github.io/kakusei/security.html"
    publish_source: "GitHub Actions Pages artifact from main branch repository root '.'"
  implementation_baseline_before_handoff_packet:
    commit: "e4921e48c10b87c747a2819ce2b5716ced8816fe"
    commit_datetime_jst: "2026-07-06 14:08:22 +0900"
    message: "Set operator name to Mika Goto in policy pages (#8)"
  current_handoff_commit:
    note: "This file itself may be newer than the implementation baseline. Check git log before editing."
    previous_handoff_commit: "7e63a9a45082646ea2e895a2faf912b648b0575c"

non_negotiables:
  stage_model:
    invariant: "Seven stages must keep both names and order."
    stages:
      - { number: 1, name: "封鎖状態" }
      - { number: 2, name: "信頼の構築" }
      - { number: 3, name: "潜在意識の顕在化" }
      - { number: 4, name: "主体の回復" }
      - { number: 5, name: "小さな挑戦" }
      - { number: 6, name: "障害の突破" }
      - { number: 7, name: "場の創造と還元" }
    forbidden:
      - "Do not replace this with Level 0-3."
      - "Do not remove, rename, or reorder stages."
  pseudonymization:
    invariant: "Participants are identified by participant codes such as U001 / TEST1, not real names."
    forbidden:
      - "Do not make real names mandatory."
      - "Do not make address, phone number, or detailed affiliation mandatory."
      - "Do not replace participant-code login with real-name login."
  deployment:
    invariant: "Keep static HTML + GitHub Pages."
    forbidden:
      - "Do not introduce a build system unless explicitly requested and documented."
      - "Do not break .github/workflows/pages.yml."
  security:
    invariant: "Do not weaken Supabase RLS or widen anonymous access."
    forbidden_secrets:
      - ".env.notify contents"
      - "Supabase service_role key"
      - "LINE access token"
      - "LINE user ID"
      - "Personal IDs"
    public_key_policy: "Supabase publishable key is already in public client code; it may be referenced as public, but avoid copying token-like values unnecessarily."
  public_policy_pages:
    invariant: "privacy.html and security.html must remain available and linked."
    operator_name: "Mika Goto"
    contact_form: "https://docs.google.com/forms/d/e/1FAIpQLSfk-UokJFdVNs6_naA9SyXKo43fbirwwcEIEBaDKLQrX0tBog/viewform"

files:
  - path: ".github/workflows/pages.yml"
    lines_at_baseline: 32
    role: "GitHub Pages deployment workflow."
    structure:
      trigger: ["push to main", "workflow_dispatch"]
      artifact_path: "."
    risk_notes:
      - "Changing path or trigger can break public deployment."
  - path: "index.html"
    lines_at_baseline: 1689
    role: "Main REVERA01 app. Single static file with CSS, HTML, and JS."
    structure:
      css: "approx lines 12-715; dark UI tokens, login, participant, supporter, director views."
      html: "approx lines 717-955; login/register/forgot-code, participant/supporter/director screens."
      js: "approx lines 957-1687; Supabase client, auth flow, stage rendering, submit handlers, director dashboard."
    important_symbols:
      - "SUPABASE_URL"
      - "SUPABASE_KEY (publishable/public)"
      - "handleLogin"
      - "handleRegister"
      - "createParticipant"
      - "stageNames"
      - "stageKanji"
      - "stageDefinitions"
      - "renderParticipantForm"
      - "submitEvent"
      - "submitObservation"
      - "loadDirectorData"
    current_login_codes:
      director: "director2026"
      supporter: "supporter2026"
      participant_preview: ["TEST", "TEST1", "TEST2", "TEST3", "TEST4", "TEST5", "TEST6", "TEST7"]
    known_issues:
      - "PASSWORDS object exists but is effectively unused; handleLogin directly checks fixed codes."
      - "Register role buttons still contain old inline theme colors."
      - "Director dashboard shows participant_id UUID fragments in some tables."
      - "Some user-originated strings are rendered via innerHTML; watch XSS risk."
      - "relatedPersons and body_state UI exist, but current submitEvent payload does not persist them."
  - path: "privacy.html"
    lines_at_baseline: 137
    role: "Privacy policy."
    structure:
      css: "dark theme style block."
      html: "policy content, acquired information, purpose, Supabase storage, data minimization, contact."
    invariant_content:
      - "Operator name: Mika Goto."
      - "Participants are identified by participant code, not real name."
      - "Contact form link must remain."
  - path: "security.html"
    lines_at_baseline: 130
    role: "Security policy."
    structure:
      css: "dark theme style block."
      html: "security policy, pseudonymization, access control, incident response, contact."
    invariant_content:
      - "Participant-code pseudonymization."
      - "Role-separated screens/functions."
      - "Contact form link must remain."
  - path: "revera.html"
    lines_at_baseline: 397
    role: "Old/auxiliary localStorage page."
    storage: "localStorage key revera_records"
    status: "Not canonical. Canonical app is index.html."

branches:
  checked_after_fetch: "2026-07-13 JST"
  items:
    - name: "origin/main"
      unmerged_diff_to_main: false
      action: "base branch"
    - name: "origin/feature/operator-name"
      unmerged_diff_to_main: false
      action: "no merge needed; content effectively in main"
    - name: "origin/feature/code-recovery"
      unmerged_diff_to_main: true
      action: "do not re-merge blindly; old PR branch"
    - name: "origin/feature/policies"
      unmerged_diff_to_main: true
      action: "do not re-merge; old policy branch can revert newer footer/policy changes"
    - name: "origin/feature/redesign-dark"
      unmerged_diff_to_main: true
      action: "do not re-merge; can delete current policy pages"
    - name: "origin/feature/track-kakusei"
      unmerged_diff_to_main: true
      action: "investigate only; do not merge directly"
      reason: "Adds track branching and migrations, but also deletes privacy.html/security.html relative to main."
    - name: "origin/claude/revera-input-screen-2hlitj"
      unmerged_diff_to_main: true
      action: "old Claude branch; main already has relevant stage guide work"
    - name: "origin/claude/external-decision-criteria-uib555"
      unmerged_diff_to_main: true
      action: "possible candidate for CSS/readability/doc ideas; review before cherry-picking"
    - name: "origin/claude/ai-life-navigation-app-q1cfoe"
      unmerged_diff_to_main: true
      action: "do not merge; different Mira/life-navigator concept"
    - name: "origin/claude/ai-trust-neuroscience-posts-24xjnr"
      unmerged_diff_to_main: true
      action: "do not merge; SNS automation/card content, not REVERA01 canonical app"
    - name: "origin/claude/personal-values-philosophy-lquvgg"
      unmerged_diff_to_main: true
      action: "do not merge; values/memory branch, not app work"

supabase:
  project_url: "https://dteuzcpgjoluehfzbobn.supabase.co"
  client_library: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
  schema_verification:
    method: "Checked with public publishable key through PostgREST select endpoints."
    openapi_root_result: "Secret API key required; DB metadata not available with publishable key."
    mutation_tests: "Not performed; live DB must not be dirtied."
    important_limit: "Column types, NOT NULL, defaults, primary keys, foreign keys, and exact policy SQL are partly inferred unless marked verified."
  anonymous_rest_results:
    - endpoint: "/rest/v1/programs?select=*&limit=1"
      result: "HTTP 200 with real data"
      risk: "anonymous select is possible"
    - endpoint: "/rest/v1/participants?select=*&limit=1"
      result: "HTTP 200 with real data"
      risk: "anonymous select exposes code/nickname/supporter_note/prefecture in at least one row"
    - endpoint: "/rest/v1/events?select=*&limit=1"
      result: "HTTP 200 with real data"
      risk: "anonymous select exposes participant event data in at least one row"
    - endpoint: "/rest/v1/observations?select=*&limit=1"
      result: "HTTP 200 with empty array"
      risk: "anonymous select endpoint is accessible; actual row visibility unknown"
  tables:
    programs:
      rls_enabled: "unverified"
      anonymous_permissions:
        select: "verified_possible"
        insert: "unverified"
        update: "unverified"
        delete: "unverified"
      columns:
        - { name: "id", type: "uuid inferred", pk: "inferred", not_null: "unverified", default: "uuid generation inferred" }
        - { name: "name", type: "text inferred", not_null: "unverified" }
        - { name: "type", type: "text inferred", not_null: "unverified" }
        - { name: "location", type: "text inferred", not_null: "unverified" }
        - { name: "started_at", type: "date/timestamptz inferred", nullable: "observed null" }
        - { name: "ended_at", type: "date/timestamptz inferred", nullable: "observed null" }
        - { name: "director_note", type: "text inferred", nullable: "observed null" }
        - { name: "created_at", type: "timestamptz inferred", default: "now inferred" }
        - { name: "updated_at", type: "timestamptz inferred", default: "now inferred" }
    participants:
      rls_enabled: "unverified"
      anonymous_permissions:
        select: "verified_possible"
        insert: "unverified"
        update: "unverified"
        delete: "unverified"
      columns:
        - { name: "id", type: "uuid inferred", pk: "inferred", default: "uuid generation inferred" }
        - { name: "program_id", type: "uuid inferred", fk: "programs.id inferred" }
        - { name: "code", type: "text inferred", purpose: "participant-code login" }
        - { name: "nickname", type: "text inferred", purpose: "display name, not real name" }
        - { name: "joined_at", type: "date inferred" }
        - { name: "current_stage", type: "integer inferred", values: "1..7" }
        - { name: "is_active", type: "boolean inferred" }
        - { name: "supporter_note", type: "text inferred", risk: "currently stores email-like information in createParticipant" }
        - { name: "prefecture", type: "text inferred", nullable: true }
        - { name: "created_at", type: "timestamptz inferred" }
        - { name: "updated_at", type: "timestamptz inferred" }
      design_issue:
        id: "participants.supporter_note_email"
        current_state: "createParticipant stores registration email into supporter_note."
        risk: "Field name and purpose mismatch; dangerous if anonymous select remains broad."
        recommendation: "Move contact data to a protected dedicated column/table or restrict anonymous select before relying on it."
    events:
      rls_enabled: "unverified"
      anonymous_permissions:
        select: "verified_possible"
        insert: "unverified"
        update: "unverified"
        delete: "unverified"
      columns:
        - { name: "id", type: "uuid inferred", pk: "inferred" }
        - { name: "participant_id", type: "uuid inferred", fk: "participants.id inferred" }
        - { name: "stage", type: "integer inferred", values: "1..7" }
        - { name: "recorded_at", type: "timestamptz inferred" }
        - { name: "status_choice", type: "integer inferred", nullable: true }
        - { name: "main_text", type: "text inferred", nullable: true, sensitivity: "free text / emotional record" }
        - { name: "branch_text", type: "text inferred", nullable: true }
        - { name: "action_taken", type: "boolean inferred", nullable: true }
        - { name: "action_text", type: "text inferred", nullable: true }
        - { name: "action_feeling", type: "integer/text inferred", nullable: true }
        - { name: "blocker_text", type: "text inferred", nullable: true }
        - { name: "obstacle_text", type: "text inferred", nullable: true }
        - { name: "coping_choice", type: "integer inferred", nullable: true }
        - { name: "can_talk_now", type: "boolean inferred", nullable: true }
        - { name: "giving_text", type: "text inferred", nullable: true }
        - { name: "giving_feeling", type: "integer/text inferred", nullable: true }
        - { name: "next_giving_text", type: "text inferred", nullable: true }
        - { name: "ai_stage_suggestion", type: "unverified", nullable: true, ui_status: "unused by current UI" }
        - { name: "ai_emotion_tags", type: "unverified", nullable: true, ui_status: "unused by current UI" }
        - { name: "ai_transform_flag", type: "boolean inferred", nullable: true, ui_status: "unused by current UI" }
        - { name: "ai_summary", type: "text inferred", nullable: true, ui_status: "unused by current UI" }
        - { name: "created_at", type: "timestamptz inferred" }
        - { name: "related_persons", type: "array/json/text inferred", nullable: true, note: "UI set exists; current submitEvent does not persist it" }
        - { name: "body_state", type: "text inferred", nullable: true, note: "UI field exists; current submitEvent does not persist it" }
    observations:
      rls_enabled: "unverified"
      anonymous_permissions:
        select: "verified_possible_empty_result"
        insert: "unverified"
        update: "unverified"
        delete: "unverified"
      columns_verified_by_select_limit_0:
        - { name: "participant_id", type: "uuid inferred", fk: "participants.id inferred" }
        - { name: "supporter_id", type: "text/uuid inferred", current_code_value: "supporter" }
        - { name: "supporter_utterance", type: "text inferred" }
        - { name: "participant_response", type: "text inferred" }
        - { name: "stage_before", type: "integer inferred" }
        - { name: "stage_after", type: "integer inferred" }
        - { name: "stage_changed", type: "boolean inferred" }
        - { name: "action_triggered", type: "boolean inferred" }
        - { name: "action_text", type: "text inferred" }
        - { name: "emotion_tags", type: "array/json inferred" }
        - { name: "transform_flag", type: "boolean inferred" }
        - { name: "alert_needed", type: "boolean inferred" }
        - { name: "alert_reason", type: "text inferred" }
        - { name: "note", type: "text inferred" }
        - { name: "observed_at", type: "timestamptz inferred" }
  security_priority:
    - "Confirm RLS enabled and exact policies from Supabase dashboard or SQL."
    - "Reduce anonymous select on participants/events before exposing more data."
    - "Separate or protect email/contact information currently written to supporter_note."

environment:
  claude_limitations:
    - "Claude environment may not reach Supabase CDN or REST."
    - "If CDN is unavailable, supabase global will be undefined and login cannot be verified by Claude."
    - "Claude should not claim runtime success unless actually verified."
  local_paths:
    app_repo: "/Users/gotoumika/Projects/kakusei"
    daily_monitor: "/Users/gotoumika/revera-daily"
    daily_readme: "/Users/gotoumika/revera-daily/README.md"
    daily_prompt: "/Users/gotoumika/revera-daily/daily_check_prompt.md"
    secrets_file_do_not_read: "/Users/gotoumika/revera-daily/.env.notify"
  revera_daily_summary:
    scheduler: "macOS launchd, daily around 06:00"
    target_repo: "mika-fukuimodel/kakusei"
    checks:
      - "last 24h commits"
      - "breaking changes"
      - "pseudonymization / participant-code preservation"
      - "Supabase RLS status when reachable"
      - "unmerged feature branches"
    canonical_model: "Seven stages x supporter observation"
    non_canonical_archived_idea: "2026-06-29 self-reflection x Level 0-3 x Ollama"

backlog:
  - id: "B01"
    title: "Show participant codes instead of participant_id UUID fragments in director dashboard"
    purpose: "Make director view human-readable while preserving pseudonymization."
    target_files: ["index.html"]
    change_plan:
      - "Edit loadDirectorData."
      - "Map events/observations participant_id to participants.code."
      - "Prefer code-only display, not real names or email-like data."
      - "If Supabase join fails under RLS, build id->code map from minimal participants query."
    acceptance:
      - "director2026 opens director dashboard."
      - "Recent events, alerts, and transform triggers show participant code where possible."
      - "Empty states still work."
      - "No new personal data is displayed."
    risks:
      - "Do not broaden anonymous select."
      - "RLS may block join; report unverified if so."
    verification:
      - "Local browser login with director2026."
      - "Check console errors."
      - "Verify with real DB only if Supabase access is available."
  - id: "B02"
    title: "Normalize register role buttons to current dark theme"
    purpose: "Remove old inline color remnants from participant/supporter registration buttons."
    target_files: ["index.html"]
    change_plan:
      - "Move inline styles to CSS classes."
      - "Use existing tokens such as --bg-input, --border-input, --text-body, --text-sub, --accent-grad."
      - "Update selectRegisterRole to toggle classes instead of writing old colors."
    acceptance:
      - "New registration screen looks consistent with current dark theme."
      - "Participant/supporter selected state is clear."
      - "TEST1 login still works."
    risks:
      - "Low risk if limited to presentation."
    verification:
      - "Open New Registration."
      - "Click participant/supporter."
      - "Smoke test TEST1."
  - id: "B03"
    title: "Decide and implement email storage strategy"
    purpose: "Stop using supporter_note as an ambiguous email/contact sink or protect it properly."
    target_files: ["index.html", "optional migrations/*.sql"]
    recommended_first_step: "Produce design/migration plan before code change."
    options:
      short_term:
        - "Keep supporter_note temporarily."
        - "Restrict anonymous select and app queries to minimum columns."
      medium_term:
        - "Create protected participant_contacts table or dedicated protected email column."
        - "Add migration and rollback."
        - "Update registration and code-recovery logic."
    acceptance:
      - "Registration still works."
      - "Email-like data is not exposed by anonymous participants select."
      - "Existing data migration plan is documented."
    risks:
      - "High security/privacy impact."
      - "Requires Supabase policy review."
    verification:
      - "Check Supabase RLS/policies."
      - "Use publishable key to confirm email-like data is not exposed."
  - id: "B04"
    title: "Decide forgot-code flow: automatic email or contact form only"
    purpose: "Make code recovery operational without leaking secrets or enabling enumeration."
    target_files: ["index.html", "optional server-side function docs"]
    current_state: "UI accepts email format and says automatic email is not ready; directs to Google Form."
    options:
      keep_form:
        - "Improve wording only."
        - "No new backend."
      add_email:
        - "Must be server-side, never client-side secret."
        - "Use rate limit and non-enumerating responses."
        - "Coordinate with B03 email storage."
    acceptance:
      - "Invalid email shows validation error."
      - "Valid email gives clear next step."
      - "No secrets in frontend or repo."
    risks:
      - "Email is personal data."
      - "Automatic flow can leak whether an address exists."
    verification:
      - "Open forgot-code form."
      - "Test invalid and valid email strings."
  - id: "B05"
    title: "Decide fixed codes versus Supabase Auth"
    purpose: "Replace or document weak director/supporter fixed-code access."
    target_files: ["index.html", "optional Supabase Auth/RLS docs"]
    current_state:
      director_code: "director2026"
      supporter_code: "supporter2026"
    options:
      short_term:
        - "Keep fixed codes but call them simple access gates."
        - "Minimize data fetched in director/supporter screens."
      medium_term:
        - "Introduce Supabase Auth."
        - "Add role/profile table or claims."
        - "Rewrite RLS around authenticated roles."
    acceptance:
      - "Participant-code login remains intact."
      - "Role permissions are clearer."
      - "RLS and UI access model match."
    risks:
      - "Auth migration can break current static flow."
      - "Do not require real names."
    verification:
      - "TEST1-TEST7."
      - "supporter2026/director2026 or replacement flow."
      - "Direct REST access with publishable key."
  - id: "B06"
    title: "Review feature/track-kakusei for selective adoption"
    purpose: "Evaluate local/startup two-vote track branching without losing current policy pages."
    source_branch: "origin/feature/track-kakusei"
    target_files:
      - "TRACK_BRANCHING.md"
      - "track-logic.js"
      - "track-logic.test.js"
      - "migrations/001_track_branching.sql"
      - "migrations/001_track_branching_rollback.sql"
      - "migrations/002_auth_hardening_PLAN.sql"
      - "index.html"
    rule: "Do not merge the branch directly."
    reason: "Branch diff deletes privacy.html and security.html relative to main."
    acceptance:
      - "Policy pages remain."
      - "Seven-stage model remains canonical."
      - "Track is optional/additional, not a replacement."
      - "Migration and rollback are documented."
    verification:
      - "Read diff origin/main..origin/feature/track-kakusei."
      - "Re-implement needed parts on current main."
  - id: "B07"
    title: "Audit and minimize Supabase anonymous access / RLS"
    purpose: "Fix the verified risk that anonymous select returns real participants/events data."
    target_files: ["optional migrations/*.sql", "index.html"]
    required_first_step:
      - "Obtain RLS/policy definitions from Supabase dashboard or SQL."
      - "Do not ask for service_role key in chat."
    acceptance:
      - "Anonymous REST cannot read sensitive free text or email-like data."
      - "App still supports required login/register/record flows."
      - "SQL and rollback are documented."
    risks:
      - "Highest security impact."
      - "Incorrect RLS can break the app."
    verification:
      - "curl with publishable key for programs/participants/events/observations."
      - "Browser smoke tests."

smoke_test_log:
  date_jst: "2026-07-13"
  local_url: "http://127.0.0.1:8765/index.html"
  command: "python3 -m http.server 8765 --bind 127.0.0.1"
  results:
    - { code: "TEST1", ok: true, role: "PARTICIPANT", stage: "一 / 封鎖状態" }
    - { code: "TEST2", ok: true, role: "PARTICIPANT", stage: "二 / 信頼の構築" }
    - { code: "TEST3", ok: true, role: "PARTICIPANT", stage: "三 / 潜在意識の顕在化" }
    - { code: "TEST4", ok: true, role: "PARTICIPANT", stage: "四 / 主体の回復" }
    - { code: "TEST5", ok: true, role: "PARTICIPANT", stage: "五 / 小さな挑戦" }
    - { code: "TEST6", ok: true, role: "PARTICIPANT", stage: "六 / 障害の突破" }
    - { code: "TEST7", ok: true, role: "PARTICIPANT", stage: "七 / 場の創造と還元" }
    - { code: "supporter2026", ok: true, role: "SUPPORTER", visible: "観察を記録する" }
    - { code: "director2026", ok: true, role: "DIRECTOR", visible_tabs: "概要/参加者/アラート/変容トリガー" }
  console_errors_or_warnings: []
  not_verified:
    - "No live insert/update/delete performed."
    - "No screenshot attached."
    - "Runtime verification depends on Supabase/CDN availability."

output_contract_for_claude:
  after_any_change_report:
    required_sections:
      - "対象 backlog id"
      - "変更ファイル"
      - "実施内容"
      - "確認結果"
      - "未確認事項"
      - "非交渉要件への影響"
  commit_policy:
    - "Commit only requested changes."
    - "Do not commit secrets."
    - "Do not include unrelated branch content."
```
