import { readFileSync } from "node:fs";

const { DEVIN_API_KEY, DEVIN_ORG_ID, GITHUB_TOKEN, GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env;
if (!DEVIN_API_KEY || !DEVIN_ORG_ID) throw new Error("DEVIN_API_KEY/DEVIN_ORG_ID 시크릿 필요");

const ev = JSON.parse(readFileSync(GITHUB_EVENT_PATH, "utf8"));
const isReview = Boolean(ev.pull_request) && !ev.issue;
const target = ev.issue ?? ev.pull_request;
const comment = ev.comment;
const isPR = Boolean(ev.issue?.pull_request) || isReview;

// PR 스레드에서 저장소 소유자가 쓴 @devin은 Devin 네이티브/자동화가 처리 — 중복 방지로 브릿지는 건너뜀
if (isPR && ev.comment.author_association === "OWNER") {
  console.log("owner on PR — Devin 자체 처리에 맡김");
  process.exit(0);
}

const ask = comment.body.replace(/@devin\b/i, "").trim() || "이 스레드의 내용을 검토해줘";
const kind = isReview ? `PR #${target.number} 코드 리뷰 코멘트(${comment.path})` : isPR ? `PR #${target.number} "${target.title}"` : `이슈 #${target.number} "${target.title}"`;

const DH = { Authorization: "Bearer " + DEVIN_API_KEY, "Content-Type": "application/json" };
const GH = { Authorization: "Bearer " + GITHUB_TOKEN, Accept: "application/vnd.github+json", "User-Agent": "devin-mention-bridge", "Content-Type": "application/json" };
const dget = p => fetch(`https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}/${p}`, { headers: DH }).then(r => r.json());
const postComment = body => isReview
  ? fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/comments/${comment.id}/replies`, { method: "POST", headers: GH, body: JSON.stringify({ body }) }).then(r => r.json())
  : fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${target.number}/comments`, { method: "POST", headers: GH, body: JSON.stringify({ body }) }).then(r => r.json());

const prompt = [
  `github.com/${GITHUB_REPOSITORY} 저장소의 ${kind} 스레드에서 @${comment.user.login}이(가) 아래 요청을 남겼다.`,
  "",
  `> ${ask}`,
  "",
  "관련 코드·이슈/PR 내용을 직접 확인한 뒤 한국어로 간결하고 정확한 답을 작성하라.",
  "이 세션의 마지막 응답 메시지가 GitHub 댓글 스레드에 그대로 게시된다 — 추가 확인을 요청하지 말고 최선의 답으로 완결하라.",
  "커밋·push·PR 승인·머지 같은 쓰기 작업은 하지 않는다(응답 전용).",
].join("\n");

const sess = await fetch(`https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}/sessions`, {
  method: "POST", headers: DH,
  body: JSON.stringify({ prompt, title: `@${comment.user.login}: ${kind}` }),
}).then(r => r.json());
if (!sess.session_id) { console.error("session create failed:", sess); process.exit(1); }

const url = sess.url ?? `https://app.devin.ai/sessions/${sess.session_id}`;
await postComment(`🤖 **Devin 세션 시작** — @${comment.user.login}님의 요청을 처리합니다.\n완료되면 답변이 이 스레드에 자동 게시됩니다. [세션 보기](${url})`);
console.log("session:", sess.session_id, url);

const deadline = Date.now() + 8 * 60_000;
let answer = null;
while (Date.now() < deadline) {
  await new Promise(r => setTimeout(r, 20_000));
  const s = await dget(`sessions/${sess.session_id}`);
  if (s.status === "running") continue;
  const msgs = await dget(`sessions/${sess.session_id}/messages`);
  const last = (msgs.items ?? []).filter(m => m.source === "devin").pop();
  answer = last?.message?.trim() || null;
  break;
}

await postComment(answer
  ? `**@${comment.user.login}님의 요청에 대한 Devin 답변:**\n\n${answer}\n\n---\n[Devin 세션](${url})에서 상세 작업을 볼 수 있습니다.`
  : `⏳ Devin 세션이 아직 진행 중입니다 — [세션 링크](${url})에서 확인하고, 이어서 지시하려면 세션 안에서 대화해주세요.`);
console.log("done, answer:", answer ? "yes" : "timeout");
