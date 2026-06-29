// Instagramへ画像付きで投稿する（Meta Graph API）。
// Instagramは公開URL上の画像しか受け付けないため、先にpushされたraw URLを使う。
// 必要なenv: IG_USER_ID, IG_ACCESS_TOKEN
import { buildCaption, rawImageUrl } from "./lib.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";

export function igConfigured() {
  return Boolean(process.env.IG_USER_ID && process.env.IG_ACCESS_TOKEN);
}

async function graph(path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { method: "POST" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Graph API ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

export async function postToInstagram(post) {
  if (!igConfigured()) {
    console.log("· Instagram: トークン未設定のためスキップ（ドライラン）");
    return { skipped: true };
  }
  const imageUrl = rawImageUrl(post.id);
  if (!imageUrl) {
    throw new Error(
      "Instagram: 画像の公開URLを特定できません（GITHUB_REPOSITORY か PUBLIC_IMAGE_BASE を設定してください）"
    );
  }
  const igUser = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;

  // 1) メディアコンテナを作成
  const container = await graph(`${igUser}/media`, {
    image_url: imageUrl,
    caption: buildCaption(post, "instagram"),
    access_token: token,
  });
  // 2) 公開
  const published = await graph(`${igUser}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  console.log(`· Instagram: 投稿成功 id=${published.id}`);
  return { id: published.id };
}
