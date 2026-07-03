"use client";

import { useEffect, useState } from "react";

export default function AdminModePage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("gameverse_admin") === "on");
  }, []);

  const turnOn = () => {
    localStorage.setItem("gameverse_admin", "on");
    setIsAdmin(true);
  };

  const turnOff = () => {
    localStorage.removeItem("gameverse_admin");
    setIsAdmin(false);
  };

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold">管理者モード</h1>

        <div className="mt-6 rounded-lg border p-4">
          <p className="text-sm text-gray-700">
            現在の状態：
            <span className={isAdmin ? "font-bold text-red-600" : "font-bold"}>
              {isAdmin ? "ON" : "OFF"}
            </span>
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={turnOn}
              className="rounded-lg bg-black px-4 py-2 text-white"
            >
              管理者モードON
            </button>

            <button
              onClick={turnOff}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              管理者モードOFF
            </button>
          </div>
        </div>

        <a
          href="/board/zatsudan"
          className="mt-6 inline-block rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          雑談ページへ戻る
        </a>
      </div>
    </main>
  );
}