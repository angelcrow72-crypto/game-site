"use client";

import { useState } from "react";

export default function CreatorLoginPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const code = inviteCode.trim();

    if (!code) {
      setMessage("招待コードを入力してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/creator/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: code,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "ログインに失敗しました。");
        return;
      }

      localStorage.setItem("creatorId", String(json.creator.id));
      localStorage.setItem("creatorName", String(json.creator.display_name));

      location.href = "/creator/dashboard";
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold mb-2">作者ログイン</h1>

        <p className="text-sm text-gray-600 mb-6">
          GAME VERSEから発行された招待コードを入力してください。
        </p>

        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="招待コード"
          className="w-full rounded-lg border px-4 py-3 mb-4"
        />

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-red-600">
            {message}
          </p>
        )}

        <div className="mt-6 text-xs text-gray-500">
          テスト用招待コード：K7xP2mQa9L
        </div>
      </div>
    </main>
  );
}