// 記事を「覚醒モデル」風の縦長カード画像(1080x1350)に変換する。
// Playwright(Chromium)でHTMLをスクリーンショットして高品質な日本語組版を実現。
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { CARDS_DIR, cardPath, slidePath } from "./lib.mjs";

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ── フィード用の共通スタイル ──
const FEED_STYLE = `
  :root{ --ink:#1a1410; --gold:#b8860b; --gold-light:#d4a017; --paper:#f5f0e8; --muted:#9d907b; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  html,body{ width:1080px; height:1350px; }
  body{
    background:
      radial-gradient(1100px 700px at 50% 30%, #241c12 0%, var(--ink) 62%),
      var(--ink);
    color:var(--paper); font-family:'Noto Sans JP', sans-serif;
    padding:90px 80px 74px; display:flex; flex-direction:column;
  }
  .top{ min-height:60px; }
  .tag{
    display:inline-block; font-size:30px; letter-spacing:.16em; color:var(--gold-light);
    border:1px solid var(--gold); border-radius:999px; padding:11px 30px;
  }
  .page{ font-size:30px; letter-spacing:.22em; color:var(--muted); }
  .mid{ flex:1; display:flex; flex-direction:column; justify-content:center; }
  .cover-title{
    font-family:'Shippori Mincho', serif; font-weight:800; color:#fff;
    font-size:78px; line-height:1.4; letter-spacing:.02em;
  }
  .cover-title .q{ color:var(--gold-light); }
  .point{ position:relative; padding-left:56px; }
  .point::before{
    content:""; position:absolute; left:4px; top:24px;
    width:22px; height:22px; border-radius:50%;
    background:var(--gold-light); box-shadow:0 0 16px rgba(212,160,23,.6);
  }
  .point .text{ font-size:52px; line-height:1.62; font-weight:500; color:#fff; }
  .point .source{
    margin-top:34px; font-size:32px; line-height:1.6; color:var(--muted);
    font-weight:400; padding-left:22px; border-left:3px solid var(--gold);
  }
  .bottom{ display:flex; flex-direction:column; align-items:center; gap:24px; }
  .dots{ display:flex; gap:16px; }
  .dot{ width:13px; height:13px; border-radius:50%; background:#4a3f2e; }
  .dot.on{ background:var(--gold-light); box-shadow:0 0 12px rgba(212,160,23,.6); }
  .foot{ display:flex; gap:20px; align-items:center; font-size:26px; letter-spacing:.14em; color:var(--muted); }
  .foot b{ font-family:'Shippori Mincho', serif; color:var(--gold-light); font-weight:700; letter-spacing:.22em; }
`;

function feedFooter(index, total) {
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="dot${i === index ? " on" : ""}"></span>`
  ).join("");
  const hint = index < total - 1 ? "<span>スワイプ →</span>" : "";
  return `<div class="bottom"><div class="dots">${dots}</div>
    <div class="foot"><b>覚醒モデル</b>${hint}</div></div>`;
}

// フィードの表紙（見出し）
function feedCoverHtml(post, total) {
  const titleHtml = esc(post.title)
    .replace(/\n/g, "<br>")
    .replace(/「([^」]*)」/g, '<span class="q">「$1」</span>');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>${FEED_STYLE}</style></head><body>
  <div class="top"><span class="tag">${esc(post.theme)}</span></div>
  <div class="mid"><div class="cover-title">${titleHtml}</div></div>
  ${feedFooter(0, total)}
</body></html>`;
}

// フィードの締めページ（最終ページの問いかけは金色で強調）
function feedClosingHtml(text, index, total, isLast) {
  const textHtml = esc(text).replace(/\n/g, "<br>");
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>${FEED_STYLE}
  .closing-text{
    font-family:'Shippori Mincho', serif; font-weight:700;
    color:${isLast ? "var(--gold-light)" : "#fff"};
    font-size:${isLast ? 66 : 62}px; line-height:1.7; letter-spacing:.02em;
    ${isLast ? "text-align:center;" : ""}
  }
</style></head><body>
  <div class="top"><span class="page">${String(index + 1).padStart(
    2,
    "0"
  )} / ${String(total).padStart(2, "0")}</span></div>
  <div class="mid"><div class="closing-text">${textHtml}</div></div>
  ${feedFooter(index, total)}
</body></html>`;
}

// フィードの本文（ポイント1つ＋根拠）
function feedPointHtml(point, index, total) {
  const sourceHtml = point.source
    ? `<div class="source">${esc(point.source)}</div>`
    : "";
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>${FEED_STYLE}</style></head><body>
  <div class="top"><span class="page">${String(index + 1).padStart(
    2,
    "0"
  )} / ${String(total).padStart(2, "0")}</span></div>
  <div class="mid"><div class="point"><div class="text">${esc(
    point.text
  )}</div>${sourceHtml}</div></div>
  ${feedFooter(index, total)}
</body></html>`;
}

// ── カルーセル1枚ぶんのHTML（1ページ＝短い言葉。文字数はできるだけ絞る）──
function slideHtml(slide, index, total, theme) {
  const isCover = index === 0;
  const textHtml = esc(slide.text || slide).replace(/\n/g, "<br>");
  const kicker = isCover
    ? `<span class="tag">${esc(theme)}</span>`
    : `<span class="page">${String(index + 1).padStart(2, "0")} / ${String(
        total
      ).padStart(2, "0")}</span>`;
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="dot${i === index ? " on" : ""}"></span>`
  ).join("");
  const swipe =
    index < total - 1
      ? `<span class="swipe">スワイプ →</span>`
      : `<span class="swipe">覚醒モデル</span>`;
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root{ --ink:#1a1410; --gold:#b8860b; --gold-light:#d4a017; --paper:#f5f0e8; --muted:#9d907b; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  html,body{ width:1080px; height:1350px; }
  body{
    background:
      radial-gradient(1100px 700px at 50% 42%, #241c12 0%, var(--ink) 62%),
      var(--ink);
    color:var(--paper);
    font-family:'Noto Sans JP', sans-serif;
    padding:80px; display:flex; flex-direction:column;
  }
  .top{ display:flex; justify-content:space-between; align-items:center; min-height:56px; }
  .tag{
    font-size:28px; letter-spacing:.16em; color:var(--gold-light);
    border:1px solid var(--gold); border-radius:999px; padding:10px 26px;
  }
  .page{ font-size:30px; letter-spacing:.22em; color:var(--muted); }
  .center{ flex:1; display:flex; align-items:center; justify-content:center; text-align:center; }
  .big{
    font-family:'Shippori Mincho', serif; font-weight:800; color:#fff;
    font-size:${isCover ? 118 : 132}px; line-height:1.34; letter-spacing:.03em;
    text-shadow:0 4px 40px rgba(0,0,0,.4);
  }
  .big .accent{ color:var(--gold-light); }
  .bottom{ display:flex; flex-direction:column; align-items:center; gap:26px; }
  .dots{ display:flex; gap:14px; }
  .dot{ width:12px; height:12px; border-radius:50%; background:#4a3f2e; }
  .dot.on{ background:var(--gold-light); box-shadow:0 0 12px rgba(212,160,23,.6); }
  .swipe{ font-size:26px; letter-spacing:.2em; color:var(--muted); font-family:'Shippori Mincho', serif; }
</style></head><body>
  <div class="top">${kicker}<span class="brand-mini"></span></div>
  <div class="center"><div class="big">${textHtml}</div></div>
  <div class="bottom"><div class="dots">${dots}</div>${swipe}</div>
</body></html>`;
}

function cardHtml(post) {
  const titleHtml = esc(post.title).replace(/\n/g, "<br>");
  // 新形式: points=[{text, source}] があれば「小項目＋論文的根拠」で描画
  let items;
  if (Array.isArray(post.points)) {
    items = post.points
      .map(
        (p) =>
          `<li>${esc(p.text)}${
            p.source
              ? `<div class="source">根拠：${esc(p.source)}</div>`
              : ""
          }</li>`
      )
      .join("");
  } else {
    items = (post.body || []).map((t) => `<li>${esc(t)}</li>`).join("");
  }
  const leadHtml = post.lead
    ? `<div class="lead">${esc(post.lead)}</div>`
    : "";
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
  /* 「小項目＋論文的根拠」形式は、ゆったり大きめに */
  ul.points{ gap:46px; }
  ul.points li{ font-size:35px; line-height:1.55; font-weight:500; }
  .source{
    margin-top:16px; font-size:27px; line-height:1.5; color:var(--muted);
    font-weight:400; padding-left:18px; border-left:2px solid var(--gold);
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
  ${leadHtml}
  <ul class="${Array.isArray(post.points) ? "points" : ""}">${items}</ul>
  ${closing}
  <div class="brand"><b>覚醒モデル</b><span>AI × 脳神経科学 × 複雑系</span></div>
</body></html>`;
}

async function withBrowser(fn) {
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
    return await fn(page);
  } finally {
    await browser.close();
  }
}

async function shoot(page, html, out) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready); // Webフォント読込待ち
  await page.screenshot({ path: out });
  return out;
}

// 1枚もの（旧形式）
export async function renderCard(post) {
  return withBrowser((page) => shoot(page, cardHtml(post), cardPath(post.id)));
}

// フィード（format:"feed"）: 表紙＋ポイントごとに1枚ずつ画像を生成
export async function renderFeed(post) {
  // closing は文字列でも配列でもOK（1文＝1ページ）
  const closings = post.closing
    ? Array.isArray(post.closing)
      ? post.closing
      : [post.closing]
    : [];
  const total = 1 + post.points.length + closings.length; // 表紙+各ポイント+締め
  return withBrowser(async (page) => {
    const paths = [];
    // 表紙
    let out = slidePath(post.id, 0);
    await shoot(page, feedCoverHtml(post, total), out);
    paths.push(out);
    // 各ポイント
    for (let i = 0; i < post.points.length; i++) {
      out = slidePath(post.id, i + 1);
      await shoot(page, feedPointHtml(post.points[i], i + 1, total), out);
      paths.push(out);
    }
    // 締め（複数ページ対応・最終ページは強調）
    for (let i = 0; i < closings.length; i++) {
      const index = 1 + post.points.length + i;
      out = slidePath(post.id, index);
      await shoot(
        page,
        feedClosingHtml(closings[i], index, total, i === closings.length - 1),
        out
      );
      paths.push(out);
    }
    return paths;
  });
}

// カルーセル（slides がある場合）: 1ページずつ画像を生成
export async function renderSlides(post) {
  const total = post.slides.length;
  return withBrowser(async (page) => {
    const paths = [];
    for (let i = 0; i < total; i++) {
      const out = slidePath(post.id, i);
      await shoot(page, slideHtml(post.slides[i], i, total, post.theme), out);
      paths.push(out);
    }
    return paths;
  });
}

// format:"feed" → フィード分割、slides → カルーセル、なければ1枚もの
export async function renderPost(post) {
  if (post.format === "feed" && Array.isArray(post.points)) {
    return renderFeed(post);
  }
  if (Array.isArray(post.slides) && post.slides.length > 0) {
    return renderSlides(post);
  }
  return [await renderCard(post)];
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
  const paths = await renderPost(post);
  console.log(`画像を生成しました（${paths.length}枚）:`);
  for (const p of paths) console.log(`  - ${p}`);
  // GitHub Actions向けに選んだIDを出力
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `post_id=${post.id}\n`, {
      flag: "a",
    });
  }
}
