"use client";

import { useEffect, useMemo, useState } from "react";
import { loadThreads, createThread, type Thread } from "@/lib/boardStorage";

export default function ZatsudanPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 1800);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const t = await loadThreads();
      setThreads(t);
    } catch (e: any) {
      showToast(`読み込み失敗: ${e?.message ?? "error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      const { id } = await createThread(trimmed);
      setTitle("");
      showToast("スレを作成しました");
      location.href = `/board/zatsudan/${id}`;
    } catch (e: any) {
      showToast(`作成失敗: ${e?.message ?? "error"}`);
    }
  };

  const canCreate = useMemo(() => Boolean(title.trim()), [title]);

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-3xl">
        {toast && (
          <div className="mb-4 rounded-lg border bg-gray-50 px-4 py-2 text-sm text-gray-700">
            {toast}
          </div>
        )}

        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold">雑談</h1>
          <span className="text-xs text-gray-500">Supabase(DB)運用</span>
        </div>

        {/* 新規スレ作成 */}
        <div className="mt-6 rounded-lg border p-4">
          <div className="text-sm font-semibold text-gray-700">新規スレ作成</div>
          <div className="mt-3 grid gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="スレタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
              onClick={onCreate}
              disabled={!canCreate}
            >
              作成して開く
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
            onClick={refresh}
          >
            再読み込み
          </button>
        </div>

        {/* スレ一覧 */}
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="rounded-lg border p-4 text-gray-600">読み込み中…</div>
          ) : threads.length === 0 ? (
            <div className="rounded-lg border p-4 text-gray-600">
              スレがありません（新規作成してみてください）
            </div>
          ) : (
            threads.map((t) => (
              <a
                key={t.id}
                href={`/board/zatsudan/${t.id}`}
                className="block rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="font-semibold">{t.title}</div>
                <div className="mt-1 text-sm text-gray-600">
                  作成日: {t.createdAt} / 返信: {t.replies}
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
