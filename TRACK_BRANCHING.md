# トラック分岐（feature/track-kakusei）

参加者を local（域内で価値を循環）/ startup（域外へ価値を広げる）に**後置きで**分類する。
場（カリキュラム・コミュニティ）は分けない。分岐するのは伴走の焦点のみ。七段階ステージ（変容の軸）とは直交。

## 判定方式（2票制）
- **申告票**: 登録時の2問（Q1顧客の所在=主／Q2出資意向=従。Q1がunclearの時のみQ2で補完）
- **行動票**: 支援者の観察記録に付ける「行動の向き」(local/startup/neutral、既定neutral)。直近8件のneutral除外多数決、有効2票未満は保留
- **判定**: 4週経過後、申告と行動が一致→自動確定(auto_agreed)。不一致・保留→ディレクター確定(facilitator_decision)。本人希望の転線は随時(transfer_request)
- AI推論・外部API送信は一切追加していない（`track-logic.js`はローカル計算のみ）

## 現在トラックの真実源
`track_decisions` の最新 `new_track`。participants.track の直接UPDATEはRLS暫定ロックダウンで匿名に許していないため、判定確定は track_decisions へのINSERTのみで行う。participants.track の更新は Auth本修正(002)で認証スタッフ操作に置換予定。

## ファイル
- `track-logic.js` … 判定の純粋関数（combineDeclared / tallyBehavioral / decideTrack / transferRate / isEvaluationDue）
- `track-logic.test.js` … 単体/結合テスト（`node track-logic.test.js`、21件）
- `migrations/001_track_branching.sql` … DB拡張（+rollback）。Supabase SQL Editorで適用
- `migrations/002_auth_hardening_PLAN.sql` … Auth本修正の設計【未適用】
- `index.html` … 申告2問・行動票セレクタ・トラック判定タブ・転線率表示

## 転線率
`track_decisions`で確定済みトラック間(local↔startup)を乗り換えた参加者比率。初回付与(undecided→X)は数えない。健全域10〜20%（<10%同調圧力/>30%精度不足）。

## 行政向け出力
`getGovExport()` はトラック別の行動事実(人数・ステージ分布・記録数)のみ。orientation_tagの内訳・判定根拠(basis)は内部限定で非掲載。
