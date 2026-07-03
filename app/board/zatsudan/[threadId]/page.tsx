"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  loadThreads,
  loadPosts,
  addPost,
  addReport,
  type Post,
  type Thread,
  type Report,
} from "@/lib/boardStorage";

const MAX_NAME = 20;
const MAX_BODY = 1000;

// テスト用：管理者モード（本番前に削除）
const ADMIN_KEY = "game-site:adminMode";
const LAST_POST_KEY = "lastPostTime";
const BOARD_USER_ID_KEY = "board_user_id";

// ===== NGワード（最低限） =====
const NG_WORDS = ["死ね", "殺す", "違法", "差別", "荒らし"];

function nowString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function loadAdminMode(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

function saveAdminMode(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_KEY, on ? "1" : "0");
}

function getLastPostTime(): number {
  try {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(LAST_POST_KEY) || 0);
  } catch {
    return 0;
  }
}

function setLastPostTimeNow() {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_POST_KEY, String(Date.now()));
  } catch {}
}

function createBoardUserId() {
  return Math.random().toString(16).slice(2, 8).toUpperCase();
}

function getBoardUserId() {
  if (typeof window === "undefined") return "------";

  let id = localStorage.getItem(BOARD_USER_ID_KEY);

  if (!id) {
    id = createBoardUserId();
    localStorage.setItem(BOARD_USER_ID_KEY, id);
  }

  return id;
}

export default function ZatsudanThreadPage() {
  const pathname = usePathname();

  const threadId = useMemo(() => {
    const parts = (pathname ?? "").split("/");
    return parts[3] ?? "";
  }, [pathname]);

  const [threadTitle, setThreadTitle] = useState("スレッド");
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminMode, setAdminMode] = useState(false);

  const [name, setName] = useState("名無しさん");
  const [body, setBody] = useState("");
  const bodyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const trimmedName = name.trim().slice(0, MAX_NAME) || "名無しさん";
  const trimmedBody = body.replace(/\r\n/g, "\n").trim().slice(0, MAX_BODY);
  const canSubmit = Boolean(threadId) && trimmedBody.length > 0;

  const showToast = (msg: string) => {
    setToast(msg);
    if (typeof window !== "undefined") {
      window.clearTimeout((showToast as any)._t);
      (showToast as any)._t = window.setTimeout(() => setToast(""), 1800);
    }
  };

  const refresh = async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const ths = await loadThreads();
      const t = ths.find((x: Thread) => x.id === threadId);
      setThreadTitle(t?.title ?? "スレッドが見つかりません");

      const p = await loadPosts(threadId);
      setPosts(p);
    } catch (e: any) {
      showToast(`読み込み失敗: ${e?.message ?? "error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAdminMode(loadAdminMode());
  }, []);

  useEffect(() => {
    refresh();
  }, [threadId]);

  const onToggleAdmin = () => {
    // OFF → ON のときだけパスワード要求（UI側の簡易ロック）
    if (!adminMode) {
      const pass = prompt("管理者パスワードを入力してください");
      if (pass !== "GOYA2026") {
        alert("パスワードが違います");
        return;
      }
    }

    const next = !adminMode;
    setAdminMode(next);
    saveAdminMode(next);
    showToast(next ? "管理者モード: ON" : "管理者モード: OFF");
  };

  const onSubmit = async () => {
    if (!canSubmit) return;

    // 文字数制限（入力側でも maxLength あるが念のため）
    if (trimmedName.length > MAX_NAME) {
      alert("名前は20文字以内で入力してください");
      return;
    }
    if (trimmedBody.length > MAX_BODY) {
      alert("本文は1000文字以内で入力してください");
      return;
    }

    // NGワード（本文ベース）
    if (NG_WORDS.some((word) => trimmedBody.includes(word))) {
      alert("不適切な表現が含まれています。");
      return;
    }

    // 連投制限（2分）
    const lastPost = getLastPostTime();
    if (Date.now() - lastPost < 120000) {
      alert("連続投稿は2分待ってください。");
      return;
    }

    try {
      await addPost({
        threadId,
        name: trimmedName,
        userId: getBoardUserId(),
        body: trimmedBody,
      });
      setLastPostTimeNow();
      setBody("");
      showToast("書き込みました");
      await refresh();
    } catch (e: any) {
      showToast(`投稿失敗: ${e?.message ?? "error"}`);
    }
  };

  // ここは string のままでOK（TypeScriptエラー解消）
  const reportPost = async (postId: string) => {
    const reason = prompt(
      "通報理由を入力してください（spam / abuse / illegal / other）",
      "spam"
    ) as Report["reason"] | null;

    if (!reason) return;

    try {
      await addReport({
        threadId,
        postId,
        reason,
        createdAt: nowString(),
      });
      showToast("通報しました（テスト）");
    } catch (e: any) {
      showToast(`通報失敗: ${e?.message ?? "error"}`);
    }
  };

  const threadExists = threadTitle !== "スレッドが見つかりません";

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-3xl">
        {toast && (
          <div className="mb-4 rounded-lg border bg-gray-50 px-4 py-2 text-sm text-gray-700">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <a href="/board/zatsudan" className="text-blue-600 hover:underline">
            ← 雑談板へ戻る
          </a>

          <button
            className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
            onClick={onToggleAdmin}
            title="テスト用（本番前に削除）"
          >
            管理者モード：{adminMode ? "ON" : "OFF"}
          </button>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{threadTitle}</h1>

          {adminMode && threadExists && (
            <span className="shrink-0 text-xs text-gray-400">
              ※削除はテスト運用中
            </span>
          )}
        </div>

        <details className="mt-4 rounded-lg border bg-gray-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            注意書き（クリックで開閉）
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>誹謗中傷、差別、違法行為の助長、過度な性的・暴力的表現は禁止です。</li>
            <li>違反投稿は管理側で削除する場合があります。</li>
          </ul>
        </details>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
            onClick={refresh}
          >
            再読み込み
          </button>
        </div>

        {!threadExists ? (
          <div className="mt-6 rounded-lg border p-4 text-gray-600">
            スレッドが見つかりません
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-3">
              {loading ? (
                <div className="rounded-lg border p-4 text-gray-600">
                  読み込み中…
                </div>
              ) : (
                posts.map((p, idx) => {
                  // ✅ idがどの名前でも拾えるようにする（stringで統一）
                  const postIdRaw =
                    (p as any).id ?? (p as any).postId ?? (p as any).post_id;
                  const postId = postIdRaw == null ? "" : String(postIdRaw);

                  return (
                    <div
                      id={`post-${idx + 1}`}
                      key={postId || `${idx}`}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            <span className="text-blue-600">#{idx + 1}</span> {p.name}
                          </span>

                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            ID:{p.userId}
                          </span>
                        </div>
                        <span>{p.createdAt}</span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap">
                        {p.body.split("\n").map((line, i) => {
                          const match = line.match(/^>>(\d+)$/);
                          const targetNo = match?.[1];

                          return (
                            <span key={i}>
                              {targetNo ? (
                                <button
                                  type="button"
                                  className="font-semibold text-blue-600 hover:underline"
                                  onClick={() => {
                                    document
                                      .getElementById(`post-${targetNo}`)
                                      ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                  }}
                                >
                                  {line}
                                </button>
                              ) : (
                                line
                              )}
                              <br />
                            </span>
                          );
                        })}
                      </p>

                      <div className="mt-3 flex justify-end gap-3">

                        <button
                          className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                          onClick={() => {
                            const replyText = `>>${idx + 1}\n`;

                            setBody((prev) => replyText + prev);

                            setTimeout(() => {
                              const el = bodyInputRef.current;

                              if (!el) return;

                              el.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });

                              el.focus();

                              const pos = replyText.length;

                              el.setSelectionRange(pos, pos);
                            }, 0);
                          }}
                        >
                          返信
                        </button>

                        <button
                          className="rounded-lg border px-3 py-1"
                          onClick={() => {
                            if (!postId) {
                              alert("投稿IDが取得できませんでした");
                              return;
                            }
                            reportPost(postId);
                          }}
                        >
                          通報
                        </button>

                        {adminMode && (
                          <button
                            onClick={async () => {
                              if (!confirm("この投稿を削除しますか？")) return;

                              if (!postId) {
                                alert(
                                  `投稿IDが取得できませんでした: ${String(
                                    postIdRaw
                                  )}`
                                );
                                return;
                              }

                              const pass = prompt(
                                "管理者パスワードを入力してください"
                              );
                              if (!pass) return;

                              const res = await fetch(
                                `/api/posts/${encodeURIComponent(postId)}`,
                                {
                                  method: "DELETE",
                                  headers: { "x-admin-pass": pass },
                                }
                              );

                              const json = await res.json();
                              if (!res.ok) {
                                alert(json?.error ?? "削除に失敗しました");
                                return;
                              }

                              showToast("削除しました");
                              await refresh();
                            }}
                            className="rounded-lg border px-3 py-1 text-red-600 hover:bg-red-50"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-10 rounded-lg border p-4">
              <div className="text-sm font-semibold">書き込み</div>

              <input
                className="mt-2 w-full rounded-lg border px-3 py-2"
                placeholder="名前（任意）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME}
              />

              <textarea
                ref={bodyInputRef}
                style={{ resize: "none" }}
                className="mt-2 w-full rounded-lg border px-3 py-2"
                rows={5}
                placeholder="本文"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={MAX_BODY}
              />

              <button
                className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                disabled={!canSubmit}
                onClick={onSubmit}
              >
                書き込む
              </button>

              <p className="mt-2 text-xs text-gray-500">
                ※ 現在は匿名投稿（テスト運用）です
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}