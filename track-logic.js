/* REVERA / kakusei — トラック分岐 判定ロジック（純粋関数・UIとDBから独立）
 * 設計前提（変更不可）:
 *  - track = 事業の方向性の軸（local=域内で価値を循環 / startup=域外へ価値を広げる / undecided）
 *  - 七段階ステージ（変容の軸）とは直交。置き換えない・混ぜない
 *  - 判定は申告票＋行動事実の2票制・後置き。行動票はAI推論ではなく支援者の観察記録から得る
 *  - 新たなAI推論・外部API送信を一切追加しない（この関数群はローカル計算のみ）
 * Node（テスト）とブラウザ（index.html）の両方から読めるようにしている。
 */
(function (root) {
  'use strict';

  /* 申告票の合成ルール:
   *  q1（顧客の所在）を主: 'local' | 'startup' | 'unclear'
   *  q2（外部出資意向）を従: 'startup'（はい） | 'local'（いいえ） | 'neutral'（わからない）
   *  Q1がunclearの時のみQ2で補完。両方不明ならunclear。 */
  function combineDeclared(q1, q2) {
    if (q1 === 'local' || q1 === 'startup') return q1;
    if (q2 === 'local' || q2 === 'startup') return q2;
    return 'unclear';
  }

  /* 行動票の集計:
   *  観察記録の orientation_tag 配列（'local'|'startup'|'neutral' 混在）を受け取り、
   *  neutralを除外した多数決。有効票2票未満、または同数は「保留（unclear）」。
   *  戻り値: { vote:'local'|'startup'|'unclear', valid:number } */
  function tallyBehavioral(tags) {
    var votes = (tags || []).filter(function (t) { return t === 'local' || t === 'startup'; });
    if (votes.length < 2) return { vote: 'unclear', valid: votes.length };
    var l = votes.filter(function (t) { return t === 'local'; }).length;
    var s = votes.length - l;
    if (l === s) return { vote: 'unclear', valid: votes.length };
    return { vote: l > s ? 'local' : 'startup', valid: votes.length };
  }

  /* 判定（2票制）:
   *  declaredVote: combineDeclared の結果（'local'|'startup'|'unclear'）
   *  behavioral:   tallyBehavioral の結果 { vote, valid }
   *  戻り値: { track:'local'|'startup'|'undecided',
   *           method:'auto_agreed'|'facilitator_decision',
   *           agreed:boolean, reason:string }
   *  一致 → 自動確定(auto_agreed)。不一致・保留 → 人の確定待ち(facilitator_decision)。 */
  function decideTrack(declaredVote, behavioral) {
    var b = (behavioral && behavioral.vote) || 'unclear';
    var declKnown = declaredVote === 'local' || declaredVote === 'startup';
    var behKnown = b === 'local' || b === 'startup';

    if (declKnown && behKnown && declaredVote === b) {
      return { track: declaredVote, method: 'auto_agreed', agreed: true, reason: '申告と行動が一致' };
    }
    if (declKnown && behKnown && declaredVote !== b) {
      return { track: 'undecided', method: 'facilitator_decision', agreed: false, reason: '申告と行動が不一致' };
    }
    // どちらかが保留
    return { track: 'undecided', method: 'facilitator_decision', agreed: false, reason: '判定保留（有効票不足）' };
  }

  /* 転線率:
   *  track_decisions 配列 [{participant_code, previous_track, new_track}] を受け取り、
   *  判定履歴を持つ参加者のうち previous≠new が一度でもある人の比率。
   *  健全域は10〜20%。<10%=同調圧力の兆候 / >30%=初期判定の精度不足。 */
  function transferRate(decisions) {
    var byP = {};
    (decisions || []).forEach(function (d) {
      if (!d || !d.participant_code) return;
      (byP[d.participant_code] = byP[d.participant_code] || []).push(d);
    });
    var codes = Object.keys(byP);
    if (codes.length === 0) return { rate: 0, transferred: 0, total: 0, band: 'n/a', note: '判定履歴なし' };
    var transferred = 0;
    codes.forEach(function (c) {
      // 転線＝確定済みトラック間の乗り換え(local↔startup)。初回付与(undecided→X)は転線に数えない。
      var moved = byP[c].some(function (d) {
        return (d.previous_track === 'local' || d.previous_track === 'startup') &&
               (d.new_track === 'local' || d.new_track === 'startup') &&
               d.previous_track !== d.new_track;
      });
      if (moved) transferred++;
    });
    var rate = transferred / codes.length;
    var band, note;
    if (rate < 0.10) { band = 'low'; note = '同調圧力の兆候（<10%）'; }
    else if (rate <= 0.20) { band = 'healthy'; note = '健全域（10〜20%）'; }
    else if (rate <= 0.30) { band = 'watch'; note = '要注意（20〜30%）'; }
    else { band = 'high'; note = '初期判定の精度不足（>30%）'; }
    return { rate: rate, transferred: transferred, total: codes.length, band: band, note: note };
  }

  /* 4週トリガー: 参加開始から4週経過で評価対象。以降も4週ごと（>=4週なら対象）。 */
  function isEvaluationDue(joinedAtMs, nowMs) {
    if (!joinedAtMs || !nowMs) return false;
    var weeks = (nowMs - joinedAtMs) / (7 * 24 * 3600 * 1000);
    return weeks >= 4;
  }

  var api = {
    combineDeclared: combineDeclared,
    tallyBehavioral: tallyBehavioral,
    decideTrack: decideTrack,
    transferRate: transferRate,
    isEvaluationDue: isEvaluationDue,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TrackLogic = api;
})(typeof self !== 'undefined' ? self : this);
