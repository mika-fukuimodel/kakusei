// 次の未投稿記事を X と Instagram に投稿し、投稿済みとして記録する。
// 画像は事前に生成・push済みである前提（render.mjs → git push → このスクリプト）。
import { pickNext, saveState } from "./lib.mjs";
import { postToX } from "./post-x.mjs";
import { postToInstagram } from "./post-instagram.mjs";

const { next, state } = await pickNext();
if (!next) {
  console.log("未投稿の記事がありません。posts.json に追加してください。");
  process.exit(0);
}
console.log(`▶ 投稿対象: [${next.theme}] ${next.title.replace(/\n/g, " ")}`);

const results = {};
let anySuccess = false;

for (const [name, fn] of [
  ["x", postToX],
  ["instagram", postToInstagram],
]) {
  try {
    const r = await fn(next);
    results[name] = r;
    if (r && !r.skipped) anySuccess = true;
  } catch (err) {
    console.error(`· ${name}: 投稿失敗 — ${err.message}`);
    results[name] = { error: err.message };
  }
}

if (anySuccess) {
  state.posted.push(next.id);
  state.history.push({
    id: next.id,
    at: new Date().toISOString(),
    results,
  });
  await saveState(state);
  console.log(`✔ 投稿済みに記録しました: ${next.id}`);
} else {
  console.log(
    "どのプラットフォームにも投稿されなかったため、状態は更新しません（ドライラン or 失敗）。"
  );
  // ドライランでも記録したい場合は ADVANCE_ON_DRYRUN=1 を設定
  if (process.env.ADVANCE_ON_DRYRUN === "1") {
    state.posted.push(next.id);
    await saveState(state);
    console.log(`（ADVANCE_ON_DRYRUN）状態を進めました: ${next.id}`);
  }
}
