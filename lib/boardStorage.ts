import { supabase } from "@/lib/supabaseClient";

export type Thread = {
  id: string; // bigint を文字列として扱う（URLと相性が良い）
  title: string;
  author: string;
  createdAt: string; // YYYY-MM-DD 文字列
  replies: number; // (投稿数 - 1) の概算
};

export type Post = {
  id: string;
  name: string;
  userId: string;
  body: string;
  createdAt: string; // YYYY-MM-DD HH:mm
};

export type Report = {
  threadId: string;
  postId: string;
  reason: "spam" | "abuse" | "illegal" | "other";
  createdAt: string;
};

const CATEGORY = "zatsudan";

function toDateString(d: string) {
  // timestamptz -> "YYYY-MM-DD" に寄せる
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function toDateTimeString(d: string) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(
    dt.getHours()
  )}:${pad(dt.getMinutes())}`;
}

function asIdString(v: unknown) {
  return String(v);
}

function parseThreadId(threadId: string) {
  const n = Number(threadId);
  if (!Number.isFinite(n)) throw new Error("Invalid threadId");
  return n;
}

/* ===== threads ===== */

export async function loadThreads(): Promise<Thread[]> {
  const { data: threads, error } = await supabase
    .from("threads")
    .select("id,title,author,created_at")
    .eq("category", CATEGORY)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const base = (threads ?? []).map((t) => ({
    id: asIdString(t.id),
    title: t.title as string,
    author: (t.author as string) || "名無し",
    createdAt: toDateString(t.created_at as string),
    replies: 0,
  }));

  // replies を出すため、各スレの投稿数を head+count で取る（軽量）
  const withReplies = await Promise.all(
    base.map(async (th) => {
      const threadIdNum = parseThreadId(th.id);
      const { count, error: cErr } = await supabase
        .from("posts")
        .select("id", { head: true, count: "exact" })
        .eq("thread_id", threadIdNum);

      // 失敗したら replies=0 のまま返す（一覧が壊れないように）
      if (cErr) return th;
      const total = count ?? 0;
      return { ...th, replies: Math.max(0, total - 1) };
    })
  );

  return withReplies;
}

export async function createThread(
  title: string,
  author: string
): Promise<{ id: string }> {
  const safeAuthor = author.trim() || "名無し";

  const { data, error } = await supabase
    .from("threads")
    .insert([{ category: CATEGORY, title, author: safeAuthor }])
    .select("id")
    .single();

  if (error) throw error;
  return { id: asIdString(data.id) };
}

/* ===== posts ===== */

export async function loadPosts(threadId: string): Promise<Post[]> {
  const threadIdNum = parseThreadId(threadId);

  const { data, error } = await supabase
    .from("posts")
    .select("id,name,user_id,body,created_at")
    .eq("thread_id", threadIdNum)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: asIdString(p.id),
    name: p.name as string,
    userId: (p.user_id as string) || "------",
    body: p.body as string,
    createdAt: toDateTimeString(p.created_at as string),
  }));
}

export async function addPost(params: {
  threadId: string;
  name: string;
  userId: string;
  body: string;
}): Promise<void> {
  const threadIdNum = parseThreadId(params.threadId);

  const { error } = await supabase.from("posts").insert([
    {
      thread_id: threadIdNum,
      name: params.name,
      user_id: params.userId,
      body: params.body,
    },
  ]);

  if (error) throw error;
}

/* ===== reports ===== */

export async function addReport(report: Report): Promise<void> {
  const threadIdNum = parseThreadId(report.threadId);
  const postIdNum = Number(report.postId);
  const safePostId = Number.isFinite(postIdNum) ? postIdNum : null;

  const { error } = await supabase.from("reports").insert([
    {
      thread_id: threadIdNum,
      post_id: safePostId,
      reason: report.reason,
    },
  ]);

  if (error) throw error;
}

/* ===== 互換用（古い呼び出しが残っても壊れないためのダミー） ===== */
export function saveThreads(_: Thread[]) {
  // DB運用では不要（一覧は loadThreads で都度取得）
}
export function savePosts(_: string, __: Post[]) {
  // DB運用では不要（投稿は addPost を使う）
}
export function resetAllLocalData() {
  // DB運用では不要
}
// ======================
// ゲーム一覧
// ======================

export type Game = {
  id: number;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  created_at?: string;
};

export async function loadGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}