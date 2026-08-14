"use client";

import { useCallback, useEffect, useState } from "react";

type VisitStats = {
  total: number;
  today: number;
  yesterday: number;
  active: number;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [message, setMessage] = useState("");

  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const loadVisitStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const response = await fetch("/api/admin/visit-stats", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "アクセス数の取得に失敗しました。"
        );
      }

      setVisitStats({
        total: data.total ?? 0,
        today: data.today ?? 0,
        yesterday: data.yesterday ?? 0,
        active: data.active ?? 0,
      });
    } catch (error) {
      console.error("Visit stats load error:", error);

      setStatsError(
        error instanceof Error
          ? error.message
          : "アクセス数の取得に失敗しました。"
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          setAdminMode(false);
          return;
        }

        const loggedIn = data?.isAdmin === true;

        setAdminMode(loggedIn);

        if (loggedIn) {
          loadVisitStats();
        }
      } catch (error) {
        console.error("Admin session check error:", error);
        setAdminMode(false);
      }
    };

    checkSession();
  }, [loadVisitStats]);

  const login = async () => {
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error ?? "ログインに失敗しました。");
        return;
      }

      setAdminMode(true);
      setPassword("");
      setMessage("管理者モードをONにしました。");

      await fetch("/api/visit", {
        method: "DELETE",
      }).catch((error) => {
        console.error("Visit cleanup failed:", error);
      });

      loadVisitStats();
    } catch (error) {
      console.error("Admin login error:", error);
      setMessage("ログイン処理中に通信エラーが発生しました。");
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage("管理者モードの終了に失敗しました。");
        return;
      }

      setAdminMode(false);
      setVisitStats(null);
      setStatsError("");
      setMessage("管理者モードをOFFにしました。");
    } catch (error) {
      console.error("Admin logout error:", error);
      setMessage("ログアウト処理中に通信エラーが発生しました。");
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f3f3] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl bg-white p-5 shadow sm:p-6">
          <h1 className="text-2xl font-bold text-black">
            GAME VERSE 管理画面
          </h1>

          {!adminMode && (
            <div className="mt-6">
              <div className="mb-2 text-sm font-semibold text-black">
                管理者パスワード
              </div>

              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-500"
                placeholder="パスワードを入力"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    login();
                  }
                }}
              />

              <button
                type="button"
                onClick={login}
                className="mt-3 w-full rounded-lg bg-black px-4 py-2 font-semibold text-white"
              >
                ログイン
              </button>
            </div>
          )}

          <div className="mt-6 rounded-lg border p-4">
            <div className="text-sm font-semibold text-black">
              現在の状態
            </div>

            <div className="mt-1 text-black">
              管理者モード：
              <span className="font-bold">
                {adminMode ? "ON" : "OFF"}
              </span>
            </div>

            {adminMode && (
              <button
                type="button"
                onClick={logout}
                className="mt-3 w-full rounded-lg border px-4 py-2 font-semibold text-black"
              >
                管理者モードを終了
              </button>
            )}
          </div>

          {message && (
            <div className="mt-4 text-sm text-red-600">
              {message}
            </div>
          )}
        </div>

        {adminMode && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-black">
                  アクセス状況
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  日本時間を基準に集計しています。
                </p>
              </div>

              <button
                type="button"
                onClick={loadVisitStats}
                disabled={statsLoading}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statsLoading ? "更新中..." : "再読み込み"}
              </button>
            </div>

            {statsError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {statsError}
              </div>
            )}

            {statsLoading && !visitStats && (
              <div className="mt-6 text-sm text-gray-600">
                アクセス数を読み込んでいます。
              </div>
            )}

            {visitStats && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  label="現在アクティブ"
                  value={visitStats.active}
                  note="30分以内にアクセス"
                />

                <StatCard
                  label="今日の訪問者"
                  value={visitStats.today}
                  note="本日0時以降"
                />

                <StatCard
                  label="昨日の訪問者"
                  value={visitStats.yesterday}
                  note="昨日の1日分"
                />

                <StatCard
                  label="累計訪問者"
                  value={visitStats.total}
                  note="記録開始以降"
                />
              </div>
            )}
          </section>
        )}

        <a
          href="/"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← トップへ戻る
        </a>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-xl border bg-[#fafafa] p-5">
      <div className="text-sm font-semibold text-gray-700">
        {label}
      </div>

      <div className="mt-2 text-3xl font-bold text-black">
        {value.toLocaleString("ja-JP")}
        <span className="ml-1 text-base font-normal">人</span>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {note}
      </div>
    </div>
  );
}