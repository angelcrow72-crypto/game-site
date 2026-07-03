"use client";

import { useEffect, useState } from "react";

type Game = {
  id: number;
  title: string;
  creator: string;
  genre?: string;
  recommended_age?: string;
  description: string;
  thumbnail_url: string;
  download_url?: string;
  browser_play_url?: string;
};

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      setGames(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function checkInviteCode() {
    if (!inviteCode.trim()) {
      setModalMessage("招待コードを入力してください。");
      return;
    }

    setChecking(true);
    setModalMessage("");

    try {
      const res = await fetch("/api/invite/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalMessage(data.error || "招待コードが正しくありません。");
        return;
      }

      localStorage.setItem("gameverse_creator_access", "true");
      localStorage.setItem("gameverse_creator_id", data.creatorId);
      localStorage.setItem("gameverse_creator_name", data.creatorName || "");

      window.location.href = "/creator";
    } catch (e) {
      console.error(e);
      setModalMessage("確認中にエラーが発生しました。");
    } finally {
      setChecking(false);
    }
  }

  async function registerEmail() {
    if (!email.trim()) {
      setModalMessage("メールアドレスを入力してください。");
      return;
    }

    setChecking(true);
    setModalMessage("");

    try {
      const res = await fetch("/api/creator-waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalMessage(data.error || "登録に失敗しました。");
        return;
      }

      setModalMessage("登録しました。後日、審査・案内メールをお送りします。");
      setEmail("");
    } catch (e) {
      console.error(e);
      setModalMessage("登録中にエラーが発生しました。");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <header
        style={{
          height: "120px",
          background: "black",
          display: "flex",
          alignItems: "center",
          padding: "0 -40px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "450px",
            height: "150px",
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            marginLeft: "-140px",
          }}
        >
          <img
            src="/logo.png"
            alt="GAME VERSE"
            style={{
              width: "450px",
              height: "150px",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

                <div
                  style={{
                    flex: "0 0 700px",
                    display: "flex",
                    justifyContent: "center",
                    marginLeft: "120px",
                  }}
                >
                  <input
                    placeholder="サイト内検索（準備中）"
                    className="w-[380px] rounded-full bg-[#2b2b2b] border border-gray-600 px-8 py-3 text-white"
                  />
                </div>

                <button
                  onClick={() => {
                    setShowPostModal(true);
                    setModalMessage("");
                  }}
                  className="ml-8 mr-10 rounded-lg bg-white px-8 py-3 text-xl font-bold text-black hover:bg-gray-200 transition"
                >
                  投稿する
                </button>
              </header>

      <div className="flex">
        <aside className="w-[240px] bg-[#ececec] min-h-screen p-7">
          <div>
            <a
              href="/board/zatsudan"
              className="text-blue-600 block text-xl"
            >
              雑談掲示板
            </a>
          </div>
        </aside>

        <section className="flex-1 p-12">
          {games.length === 0 ? (
            <div className="text-gray-500">掲載ゲームはまだありません。</div>
          ) : (
            <div className="grid grid-cols-4 gap-8">
              {games.map((game) => (
                <a
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="block border p-3 bg-white hover:shadow-lg transition"
                >
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-500">サムネ未設定</div>
                    )}
                  </div>

                  <div className="font-bold">{game.title}</div>
                  <div className="text-gray-500 text-sm">{game.creator}</div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {game.browser_play_url && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                        ブラウザ対応
                      </span>
                    )}

                    {game.download_url && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                        DL対応
                      </span>
                    )}

                    {game.genre && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                        {game.genre}
                      </span>
                    )}

                    {game.recommended_age && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                        {game.recommended_age}
                      </span>
                    )}
                  </div>

                  <div className="text-sm mt-2 line-clamp-2">
                    {game.description}
                  </div>

                  <div className="mt-3 block bg-black text-white text-center rounded-lg p-2">
                    詳細を見る
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      {showPostModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="w-[460px] rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">ゲームを投稿する</h2>

            <p className="text-sm text-gray-600 mb-5">
              招待コードをお持ちの方は、コードを入力するとクリエイターページへ進めます。
              コードをお持ちでない方は、メールアドレスをご登録ください。
            </p>

            <div className="mb-6">
              <div className="font-bold mb-2">招待コードをお持ちの方</div>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="招待コードを入力"
                className="w-full rounded-lg border px-3 py-2 mb-3"
              />
              <button
                onClick={checkInviteCode}
                disabled={checking}
                className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:bg-gray-400"
              >
                {checking ? "確認中..." : "招待コードで進む"}
              </button>
            </div>

            <div className="border-t pt-5">
              <div className="font-bold mb-2">招待コードをお持ちでない方</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                className="w-full rounded-lg border px-3 py-2 mb-3"
              />
              <button
                onClick={registerEmail}
                disabled={checking}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
              >
                メールアドレスを登録する
              </button>
            </div>

            {modalMessage && (
              <div className="mt-4 text-sm text-red-600">{modalMessage}</div>
            )}

            <button
              onClick={() => setShowPostModal(false)}
              className="mt-5 w-full rounded-lg border px-4 py-2"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}