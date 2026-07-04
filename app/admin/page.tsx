"use client";

import { useEffect, useState } from "react";

const ADMIN_KEY = "game-site:adminMode";
const ADMIN_PASSWORD = "GOYA2026";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAdminMode(localStorage.getItem(ADMIN_KEY) === "1");
  }, []);

  const login = () => {
    if (password !== ADMIN_PASSWORD) {
      setMessage("パスワードが違います。");
      return;
    }

    localStorage.setItem(ADMIN_KEY, "1");
    setAdminMode(true);
    setPassword("");
    setMessage("管理者モードをONにしました。");
  };

  const logout = () => {
    localStorage.setItem(ADMIN_KEY, "0");
    setAdminMode(false);
    setMessage("管理者モードをOFFにしました。");
  };

  return (
    <main className="min-h-screen bg-[#f3f3f3] p-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-black">GAME VERSE 管理ページ</h1>

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-black">
            管理者パスワード
          </div>

          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 text-black placeholder:text-gray-500"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="mt-3 w-full rounded-lg bg-black px-4 py-2 text-white"
          >
            ログイン
          </button>
        </div>

        <div className="mt-6 rounded-lg border p-4">
          <div className="text-sm font-semibold text-black">
            現在の状態
          </div>

          <div className="mt-1 text-black">
            管理者モード：{adminMode ? "ON" : "OFF"}
          </div>

          {adminMode && (
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg border px-4 py-2 text-black"
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

        <a href="/" className="mt-6 block text-blue-600">
          ← トップへ戻る
        </a>
      </div>
    </main>
  );
}