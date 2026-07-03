"use client";

import { useState } from "react";

type ReportSummary = {
  game_id: number;
  total: number;
  reasons: Record<string, number>;
};

export default function AdminReportsPage() {
  const [adminPass, setAdminPass] = useState("");
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);
  const [message, setMessage] = useState("");

  const loadReports = async () => {
    setMessage("");

    try {
      const res = await fetch("/api/admin/report-summary", {
        headers: {
          "x-admin-pass": adminPass,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "取得に失敗しました");
        return;
      }

      setSummaries(json);
      setMessage("通報集計を取得しました");
    } catch {
      setMessage("通信エラーが発生しました");
    }
  };

  const hideGameByAdmin = async (gameId: number) => {
    const ok = confirm("この作品を管理者権限で非公開にしますか？");
    if (!ok) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
        headers: {
          "x-admin-pass": adminPass,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error ?? "非公開に失敗しました");
        return;
      }

      alert("管理者権限で非公開にしました");
      loadReports();
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">通報一覧</h1>

        <div className="mt-6 rounded-xl border p-5">
          <label className="mb-2 block text-sm font-bold">
            管理者パスワード
          </label>

          <input
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="w-full rounded-lg border px-4 py-3"
            placeholder="管理者パスワードを入力"
          />

          <button
            onClick={loadReports}
            className="mt-4 rounded-lg bg-black px-5 py-3 font-bold text-white"
          >
            通報集計を表示
          </button>

          {message && (
            <p className="mt-3 text-sm text-blue-600">{message}</p>
          )}
        </div>

        <section className="mt-8">
          {summaries.length === 0 ? (
            <div className="text-gray-500">
              通報はまだありません。
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((summary) => (
                <div
                  key={summary.game_id}
                  className="rounded-xl border bg-white p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xl font-bold">
                        ゲームID：{summary.game_id}
                      </div>

                      <div className="mt-1 text-sm text-red-600 font-bold">
                        通報件数：{summary.total}件
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <a
                        href={`/game/${summary.game_id}`}
                        target="_blank"
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        作品ページを開く
                      </a>

                      <button
                        onClick={() => hideGameByAdmin(summary.game_id)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        管理者非公開
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {Object.entries(summary.reasons).map(([reason, count]) => (
                      <div
                        key={reason}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm"
                      >
                        {reason} × {count}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}