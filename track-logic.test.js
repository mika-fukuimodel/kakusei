/* トラック分岐 判定ロジックの単体/結合テスト（依存なし・node track-logic.test.js で実行） */
const T = require('./track-logic.js');
let pass = 0, fail = 0;
function eq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; }
  else { fail++; console.error('  ✗ ' + name + '\n     got : ' + g + '\n     want: ' + w); }
}

console.log('# 1. 申告票 合成ルール（Q1主・Q2従、unclear境界）');
eq('Q1=local → local', T.combineDeclared('local', 'neutral'), 'local');
eq('Q1=startup → startup', T.combineDeclared('startup', 'local'), 'startup'); // Q1優先、Q2は無視
eq('Q1=unclear,Q2=startup → startup', T.combineDeclared('unclear', 'startup'), 'startup');
eq('Q1=unclear,Q2=local → local', T.combineDeclared('unclear', 'local'), 'local');
eq('Q1=unclear,Q2=neutral → unclear', T.combineDeclared('unclear', 'neutral'), 'unclear');
eq('両方未指定 → unclear', T.combineDeclared(undefined, undefined), 'unclear');

console.log('# 2. 行動票 集計（neutral除外・多数決・2票未満/同数は保留）');
eq('local×2,startup×1,neutral×3 → local', T.tallyBehavioral(['local','neutral','local','startup','neutral','neutral']), {vote:'local',valid:3});
eq('有効1票 → 保留', T.tallyBehavioral(['local','neutral','neutral']), {vote:'unclear',valid:1});
eq('同数 → 保留', T.tallyBehavioral(['local','startup']), {vote:'unclear',valid:2});
eq('startup優勢 → startup', T.tallyBehavioral(['startup','startup','local']), {vote:'startup',valid:3});

console.log('# 3. 判定 2票制（一致/不一致/保留の3パターン結合）');
// 一致 → auto_agreed
eq('申告local×行動local → auto_agreed/local',
   T.decideTrack(T.combineDeclared('local','neutral'), T.tallyBehavioral(['local','local','neutral'])),
   {track:'local',method:'auto_agreed',agreed:true,reason:'申告と行動が一致'});
// 不一致 → facilitator_decision
eq('申告startup×行動local → facilitator/undecided',
   T.decideTrack(T.combineDeclared('startup','startup'), T.tallyBehavioral(['local','local'])),
   {track:'undecided',method:'facilitator_decision',agreed:false,reason:'申告と行動が不一致'});
// 保留（行動票の有効票不足）→ facilitator_decision
eq('申告local×行動保留 → facilitator/undecided',
   T.decideTrack(T.combineDeclared('local','neutral'), T.tallyBehavioral(['local','neutral'])),
   {track:'undecided',method:'facilitator_decision',agreed:false,reason:'判定保留（有効票不足）'});

console.log('# 4. 転線率（0% / 15% / 35% とバンド注記）');
// 0%: 判定はあるが誰も転線していない（20人）
const d0 = Array.from({length:20}, (_,i)=>({participant_code:'U'+i, previous_track:'local', new_track:'local'}));
eq('0% → low/同調圧力', (r=>({rate:r.rate,band:r.band}))(T.transferRate(d0)), {rate:0,band:'low'});
// 15%: 20人中3人が転線
const d15 = Array.from({length:20}, (_,i)=>({participant_code:'U'+i, previous_track:'local', new_track: i<3?'startup':'local'}));
eq('15% → healthy/健全域', (r=>({rate:r.rate,band:r.band}))(T.transferRate(d15)), {rate:0.15,band:'healthy'});
// 35%: 20人中7人が転線
const d35 = Array.from({length:20}, (_,i)=>({participant_code:'U'+i, previous_track:'local', new_track: i<7?'startup':'local'}));
eq('35% → high/精度不足', (r=>({rate:r.rate,band:r.band}))(T.transferRate(d35)), {rate:0.35,band:'high'});
eq('判定履歴なし → n/a', (r=>r.band)(T.transferRate([])), 'n/a');
// 初回付与(undecided→X)は転線に数えない
eq('undecided→startup のみ → 0%', (r=>({rate:r.rate,transferred:r.transferred}))(
   T.transferRate([{participant_code:'A',previous_track:'undecided',new_track:'startup'},
                   {participant_code:'B',previous_track:'undecided',new_track:'local'}])),
   {rate:0,transferred:0});
// 初回付与のあとに真の転線: undecided→local→startup は1人分の転線
eq('undecided→local→startup → 1人転線', (r=>r.transferred)(
   T.transferRate([{participant_code:'A',previous_track:'undecided',new_track:'local'},
                   {participant_code:'A',previous_track:'local',new_track:'startup'}])), 1);

console.log('# 5. 4週トリガー');
const now = 1_700_000_000_000;
eq('4週未満 → false', T.isEvaluationDue(now - 20*24*3600*1000, now), false);
eq('4週以上 → true', T.isEvaluationDue(now - 30*24*3600*1000, now), true);

console.log('\n結果: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
