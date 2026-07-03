"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Game = {
  id: number;
  title: string;
  creator: string;
  creator_id?: string;

  genre?: string;
  recommended_age?: string;
  recommended_environment?: string;

  description?: string;

  play_time?: string;
  endings_count?: string;

  controls?: string;
  streaming_policy?: string;

  thumbnail_url?: string;
  thumbnail_urls?: string[];

  download_url?: string;
  browser_play_url?: string;
  webgl_play_url?: string;
  view_count?: number;

  deleted?: boolean;
  delete_reason?: string;
};

export default function GameDetailPage() {
  const pathname = usePathname();
  const gameId = pathname.split("/").pop();

  const [game, setGame] = useState<Game | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    setAdminMode(localStorage.getItem("game-site:adminMode") === "1");
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const viewerCreatorId = localStorage.getItem("creatorId") || "";

    fetch(`/api/games/${gameId}`, {
      headers: {
        "x-viewer-creator-id": viewerCreatorId,
      },
    })
      .then((res) => res.json())
      .then((data: Game) => {
        setGame(data);

        if (data.thumbnail_urls && data.thumbnail_urls.length > 0) {
          setSelectedImage(data.thumbnail_urls[0]);
        } else {
          setSelectedImage(data.thumbnail_url || "");
        }

        if (viewerCreatorId && data.creator_id === viewerCreatorId) {
          return;
        }

        fetch(`/api/games/${gameId}/view`, {
          method: "POST",
          headers: {
            "x-viewer-creator-id": viewerCreatorId,
          },
        }).catch(console.error);
      })
      .catch(console.error);
  }, [gameId]);

  const deleteGame = async () => {
    if (!gameId) return;

    const ok = confirm("このゲーム投稿を削除しますか？");
    if (!ok) return;

    const pass = prompt("管理者パスワードを入力してください");
    if (!pass) return;

    const res = await fetch(`/api/games/${gameId}`, {
      method: "DELETE",
      headers: {
        "x-admin-pass": pass,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error ?? "削除に失敗しました");
      return;
    }

    alert("削除しました");
    location.href = "/";
  };

  const reportGame = async () => {
    if (!gameId) return;

    const reason = prompt(
      "通報理由を入力してください：\nR18作品 / ウイルスの疑い / 著作権侵害 / ゲームとして成立していない / その他",
      "その他"
    );

    if (!reason) return;

    const detail = prompt("補足があれば入力してください（任意）", "") ?? "";

    const res = await fetch(`/api/games/${gameId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        detail,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error ?? "通報に失敗しました");
      return;
    }

    alert("通報を受け付けました。ご協力ありがとうございます。");
  };

  const downloadGame = async () => {
    if (!gameId) return;

    const viewerCreatorId = localStorage.getItem("creatorId") || "";

    const res = await fetch(`/api/games/${gameId}/download`, {
      method: "POST",
      headers: {
        "x-viewer-creator-id": viewerCreatorId,
      },
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error ?? "ダウンロードに失敗しました");
      return;
    }

    window.open(json.url, "_blank");
  };

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        読み込み中...
      </main>
    );
  }

  if (game.deleted) {
    return (
      <main className="min-h-screen bg-[#f3f3f3]">
        <div className="mx-auto max-w-3xl p-10">
          {game.delete_reason === "admin" ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-8 text-center">
              <h1 className="mb-4 text-2xl font-bold text-red-700">
                規約違反により管理者により削除（非公開）となりました
              </h1>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-8 text-center">
              <h1 className="mb-4 text-2xl font-bold">
                作者により削除（非公開）となりました
              </h1>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      <header
        style={{
          height: "120px",
          background: "black",
          display: "flex",
          alignItems: "center",
          paddingLeft: "32px",
          overflow: "hidden",
        }}
      >
        <a href="/">
          <img
            src="/logo.png"
            alt="GAME VERSE"
            style={{
              width: "160px",
              height: "auto",
              display: "block",
            }}
          />
        </a>
      </header>

      <div className="mx-auto max-w-6xl p-10">
        <a href="/" className="text-blue-600">
          ← トップへ戻る
        </a>

        <div className="mt-5 rounded-2xl bg-white p-8 shadow">
          <div className="mx-auto flex aspect-video w-[900px] max-w-full items-center justify-center overflow-hidden rounded-xl bg-gray-200">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-gray-500">サムネ未設定</div>
            )}
          </div>

          {game.thumbnail_urls && game.thumbnail_urls.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {game.thumbnail_urls.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-24 overflow-hidden rounded border-2 ${
                    selectedImage === img
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {game.thumbnail_urls && game.thumbnail_urls.length > 0 && (
            <p className="mt-2 text-center text-sm text-gray-500">
              サムネイルをクリックすると拡大表示できます
            </p>
          )}

          {adminMode && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              管理者表示：アクセス数 {game.view_count ?? 0}
            </div>
          )}

          <div className="mt-8 rounded-xl border p-4">
  <div className="flex gap-6">
    <div style={{ width: "260px" }} className="shrink-0">
      <h2 className="text-2xl font-bold text-black">基本情報</h2>

      <div className="mt-4 space-y-3">
        <div className="rounded p-3">
          <div className="text-sm font-semibold text-black">ゲームタイトル</div>
          <div className="mt-1 text-black">{game.title}</div>
        </div>

        <div className="rounded p-3">
          <div className="text-sm font-semibold text-black">作者名</div>
          <div className="mt-1 text-black">{game.creator}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(game.webgl_play_url || game.browser_play_url) && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              ブラウザ対応
            </span>
          )}

          {game.download_url && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
              DL対応
            </span>
          )}
        </div>

        <div className="rounded p-3">
          <div className="text-sm font-semibold text-black">ジャンル</div>
          <div className="mt-1 text-black">{game.genre || "未設定"}</div>
        </div>

        <div className="rounded p-3">
          <div className="text-sm font-semibold text-black">推奨年齢</div>
          <div className="mt-1 text-black">{game.recommended_age || "未設定"}</div>
        </div>

        <div className="rounded p-3">
          <div className="text-sm font-semibold text-black">推奨環境</div>
          <div className="mt-1 text-black">{game.recommended_environment || "未設定"}</div>
        </div>
      </div>
    </div>

    <div className="flex-1">
      <h2 className="text-2xl font-bold">作品紹介</h2>

      <div
        className="mt-4 whitespace-pre-wrap rounded-lg border bg-white p-4"
        style={{
          height: "360px",
          overflowY: "auto",
        }}
      >
        {game.description || "作品紹介はありません"}
      </div>
    </div>
  </div>
</div>

          {game.webgl_play_url ? (
            <div className="mt-10">
              <h2 className="mb-3 text-2xl font-bold">ブラウザでプレイ</h2>

              <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
                <iframe
                  src={`/api/webgl/${game.id}/index.html`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            game.browser_play_url && (
              <a
                href={game.browser_play_url}
                target="_blank"
                className="mt-10 block w-full rounded-xl bg-green-600 p-4 text-center text-white"
              >
                ブラウザでプレイ
              </a>
            )
          )}

          {game.download_url && (
            <button
              onClick={downloadGame}
              className="mt-10 block w-full rounded-xl bg-black p-4 text-center text-white"
            >
              ZIPをダウンロード
            </button>
          )}

          <button
            onClick={reportGame}
            className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-6 py-4 text-center font-bold text-gray-700 hover:bg-gray-50"
          >
            この作品を通報
          </button>

          {adminMode && (
            <button
              onClick={deleteGame}
              className="mt-4 w-full rounded-xl border border-red-300 bg-white px-6 py-4 text-center font-bold text-red-600 hover:bg-red-50"
            >
              管理者用：この投稿を削除
            </button>
          )}
        </div>
      </div>
    </main>
  );
}