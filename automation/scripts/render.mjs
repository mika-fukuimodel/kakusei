// 記事を「覚醒モデル」風の縦長カード画像(1080x1350)に変換する。
// Playwright(Chromium)でHTMLをスクリーンショットして高品質な日本語組版を実現。
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { CARDS_DIR, cardPath } from "./lib.mjs";

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function cardHtml(post) {
  const titleHtml = esc(post.title).replace(/\n/g, "<br>");
  const items = (post.body || [])
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
  const closing = post.closing
    ? `<div class="closing">「${esc(post.closing)}」</div>`
    : "";
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root{ --ink:#1a1410; --gold:#b8860b; --gold-light:#d4a017; --paper:#f5f0e8; --muted:#b8ab92; --line:#3a3024; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  html,body{ width:1080px; height:1350px; }
  body{
    background:
      radial-gradient(1200px 600px at 50% -10%, #241c12 0%, var(--ink) 55%),
      var(--ink);
    color:var(--paper);
    font-family:'Noto Sans JP', sans-serif;
    padding:90px 80px 70px;
    display:flex; flex-direction:column;
  }
  .tag{
    display:inline-block; align-self:flex-start;
    font-size:26px; letter-spacing:.18em; color:var(--gold-light);
    border:1px solid var(--gold); border-radius:999px;
    padding:8px 22px; margin-bottom:38px;
  }
  h1{
    font-family:'Shippori Mincho', serif; font-weight:800;
    font-size:62px; line-height:1.32; letter-spacing:.02em;
    color:#fff; margin-bottom:30px;
  }
  .lead{
    font-size:33px; line-height:1.6; color:var(--gold-light);
    font-weight:500; margin-bottom:40px;
    padding-left:22px; border-left:4px solid var(--gold);
  }
  ul{ list-style:none; display:flex; flex-direction:column; gap:24px; }
  li{
    position:relative; font-size:31px; line-height:1.62; color:var(--paper);
    padding-left:42px;
  }
  li::before{
    content:""; position:absolute; left:6px; top:16px;
    width:14px; height:14px; border-radius:50%;
    background:var(--gold-light); box-shadow:0 0 14px rgba(212,160,23,.6);
  }
  .closing{
    margin-top:auto; font-family:'Shippori Mincho', serif; font-weight:700;
    font-size:38px; line-height:1.5; color:#fff;
    padding-top:34px; border-top:1px solid var(--line);
  }
  .brand{
    margin-top:30px; display:flex; justify-content:space-between; align-items:center;
    font-size:24px; color:var(--muted); letter-spacing:.08em;
  }
  .brand b{ font-family:'Shippori Mincho', serif; color:var(--gold-light); font-weight:700; letter-spacing:.2em; }
</style></head><body>
  <span class="tag">${esc(post.theme)}</span>
  <h1>${titleHtml}</h1>
  <div class="lead">${esc(post.lead)}</div>
  <ul>${items}</ul>
  ${closing}
  <div class="brand"><b>覚醒モデル</b><span>AI × 脳神経科学 × 複雑系</span></div>
</body></html>`;
}

export async function renderCard(post) {
  await mkdir(CARDS_DIR, { recursive: true });
  const launchOpts = { args: ["--no-sandbox"] };
  // ローカル環境などでプリインストール済みChromiumを使う場合に指定
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  }
  const browser = await chromium.launch(launchOpts);
  try {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 2,
    });
    await page.setContent(cardHtml(post), { waitUntil: "networkidle" });
    // Webフォントの読み込み完了を待つ
    await page.evaluate(() => document.fonts.ready);
    const out = cardPath(post.id);
    await page.screenshot({ path: out });
    return out;
  } finally {
    await browser.close();
  }
}

// 単体実行: node render.mjs <postId?> でプレビュー生成
if (import.meta.url === `file://${process.argv[1]}`) {
  const { loadPosts, pickNext } = await import("./lib.mjs");
  const id = process.argv[2];
  let post;
  if (id) {
    post = (await loadPosts()).find((p) => p.id === id);
    if (!post) throw new Error(`記事が見つかりません: ${id}`);
  } else {
    post = (await pickNext()).next;
    if (!post) throw new Error("未投稿の記事がありません");
  }
  const out = await renderCard(post);
  console.log(`画像を生成しました: ${out}`);
  // GitHub Actions向けに選んだIDを出力
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `post_id=${post.id}\n`, {
      flag: "a",
    });
  }
}
