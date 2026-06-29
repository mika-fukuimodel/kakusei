// X(旧Twitter)へ画像付きで投稿する。
// 必要なenv: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
import { TwitterApi } from "twitter-api-v2";
import { buildCaption, cardPath } from "./lib.mjs";

export function xConfigured() {
  return Boolean(
    process.env.X_API_KEY &&
      process.env.X_API_SECRET &&
      process.env.X_ACCESS_TOKEN &&
      process.env.X_ACCESS_SECRET
  );
}

export async function postToX(post) {
  if (!xConfigured()) {
    console.log("· X: トークン未設定のためスキップ（ドライラン）");
    return { skipped: true };
  }
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });
  const mediaId = await client.v1.uploadMedia(cardPath(post.id));
  const res = await client.v2.tweet(buildCaption(post, "x"), {
    media: { media_ids: [mediaId] },
  });
  console.log(`· X: 投稿成功 id=${res.data.id}`);
  return { id: res.data.id };
}
