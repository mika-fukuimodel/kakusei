// 共通ヘルパー: 記事キュー・投稿状態の読み書き、キャプション生成など
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
export const POSTS_PATH = join(ROOT, "content", "posts.json");
export const STATE_PATH = join(ROOT, "content", "state.json");
export const CARDS_DIR = join(ROOT, "output", "cards");

export async function loadPosts() {
  return JSON.parse(await readFile(POSTS_PATH, "utf8"));
}

export async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8"));
  } catch {
    return { posted: [], history: [] };
  }
}

export async function saveState(state) {
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

// 次に投稿すべき記事（未投稿のうち最初の1本）を返す。peekはマークしない。
export async function pickNext() {
  const posts = await loadPosts();
  const state = await loadState();
  const next = posts.find((p) => !state.posted.includes(p.id));
  return { next, posts, state };
}

export function cardPath(id) {
  return join(CARDS_DIR, `${id}.png`);
}

// スライド(カルーセル)1枚ごとの画像パス。例: 001-trust-ai-01.png
export function slidePath(id, index) {
  return join(CARDS_DIR, `${id}-${String(index + 1).padStart(2, "0")}.png`);
}

// 投稿に含まれるスライド枚数（slidesがあればその数、なければ1）
export function slideCount(post) {
  return Array.isArray(post.slides) ? post.slides.length : 1;
}

// Instagram用の公開画像URL（GitHub Actions上ではraw.githubusercontent.comを使う）
export function rawImageUrl(id) {
  const repo = process.env.GITHUB_REPOSITORY; // 例: mika-fukuimodel/kakusei
  const branch =
    process.env.GITHUB_REF_NAME ||
    process.env.TARGET_BRANCH ||
    "claude/ai-trust-neuroscience-posts-24xjnr";
  if (process.env.PUBLIC_IMAGE_BASE) {
    return `${process.env.PUBLIC_IMAGE_BASE.replace(/\/$/, "")}/${id}.png`;
  }
  if (!repo) return null;
  return `https://raw.githubusercontent.com/${repo}/${branch}/automation/output/cards/${id}.png`;
}

// 各プラットフォーム用のキャプションを生成
export function buildCaption(post, platform) {
  const tags = (post.hashtags || []).join(" ");
  const title = (post.title || "").replace(/\n/g, " ");
  if (platform === "x") {
    // Xは280文字制限。タイトル＋リード＋ハッシュタグを280以内に収める。
    let text = `${title}\n\n${post.lead || ""}`;
    const withTags = `${text}\n\n${tags}`;
    if (withTags.length <= 277) return withTags;
    // 入らなければリードを削ってタグだけ残す
    const base = `${title}\n\n${tags}`;
    if (base.length <= 277) {
      const room = 277 - base.length;
      const lead = (post.lead || "").slice(0, Math.max(0, room - 2));
      return `${title}\n\n${lead}…\n\n${tags}`.slice(0, 280);
    }
    return base.slice(0, 280);
  }
  // Instagram（最大2200文字）
  const bodyParts = [];
  if (post.lead) bodyParts.push(post.lead);
  if (Array.isArray(post.points)) {
    bodyParts.push(
      post.points
        .map((p) => `・${p.text}${p.source ? `\n（根拠：${p.source}）` : ""}`)
        .join("\n\n")
    );
  } else if (Array.isArray(post.body)) {
    bodyParts.push(post.body.map((t) => `・${t}`).join("\n\n"));
  }
  if (post.closing) {
    bodyParts.push(
      Array.isArray(post.closing) ? post.closing.join("\n\n") : post.closing
    );
  }
  return `${title}\n\n${bodyParts.join("\n\n")}\n\n${tags}`;
}
