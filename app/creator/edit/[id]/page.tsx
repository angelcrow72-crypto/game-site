"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Game = {
  id: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
  download_url?: string;
  webgl_play_url?: string;
};

export default function CreatorEditPage() {
  const pathname = usePathname();
  const gameId = pathname.split("/").pop();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [webglPlayUrl, setWebglPlayUrl] = useState("");

  const [uploadingZip, setUploadingZip] = useState(false);
  const [uploadingWebglZip, setUploadingWebglZip] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!gameId) return;

    fetch(`/api/games/${gameId}`)
      .then((res) => res.json())
      .then((game: Game) => {
        setTitle(game.title || "");
        setDescription(game.description || "");
        setThumbnailUrl(game.thumbnail_url || "");
        setDownloadUrl(game.download_url || "");
        setWebglPlayUrl(game.webgl_play_url || "");
      })
      .catch(() => {
        setMessage("ゲーム情報の取得に失敗しました");
      });
  }, [gameId]);

  const uploadZip = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setMessage("ZIPファイルのみアップロードできます");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setMessage("ZIPファイルは500MB以下にしてください");
      return;
    }

    setUploadingZip(true);
    setMessage("ダウンロード用ZIPをアップロード中...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/game", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "ZIPアップロードに失敗しました");
        return;
      }

      setDownloadUrl(json.url);
      setMessage("ダウンロード用ZIPをアップロードしました。保存ボタンを押してください。");
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "ZIPアップロード中にエラーが発生しました");
    } finally {
      setUploadingZip(false);
    }
  };

  const uploadWebglZip = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setMessage("ZIPファイルのみアップロードできます");
      return;
    }

    setUploadingWebglZip(true);
    setMessage("WebGL ZIPをアップロード中...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-webgl", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || "WebGL ZIPのアップロードに失敗しました");
      }

      setWebglPlayUrl(result.webgl_play_url);
      setMessage("WebGL ZIPをアップロードしました。保存ボタンを押してください。");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "WebGL ZIPのアップロードに失敗しました"
      );
    } finally {
      setUploadingWebglZip(false);
    }
  };

  const onSave = async () => {
    if (!gameId) return;

    if (!title.trim()) {
      setMessage("タイトルを入力してください");
      return;
    }

    setMessage("保存中...");

    try {
      const res = await fetch(`/api/creator/games/${gameId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          downloadUrl: downloadUrl.trim(),
          webglPlayUrl: webglPlayUrl.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "保存に失敗しました");
        return;
      }

      setMessage("保存しました");
    } catch {
      setMessage("通信エラーが発生しました");
    }
  };

  const deleteGame = async () => {
    if (!gameId) return;

    const ok = confirm(
      "このゲームを削除しますか？\nサイト上から非公開になります。"
    );

    if (!ok) return;

    try {
      const res = await fetch(`/api/creator/games/${gameId}/hide`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "削除に失敗しました");
        return;
      }

      alert("ゲームを削除しました");
      location.href = "/creator/dashboard";
    } catch {
      setMessage("通信エラーが発生しました");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
        <a href="/creator/dashboard" className="text-blue-600">
          ← クリエイターページへ戻る
        </a>

        <h1 className="mt-6 text-3xl font-bold">作品情報を編集</h1>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              ゲームタイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              作品紹介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
              rows={10}
              style={{ resize: "none" }}
              placeholder="ゲーム紹介、想定プレイ時間、ED数、操作方法、実況・配信許諾等を自由に入力してください。"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              サムネURL（任意）
            </label>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              ダウンロード用ZIP（任意）
            </label>

            <label className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border bg-white hover:bg-gray-50">
              <input
                type="file"
                accept=".zip"
                disabled={uploadingZip}
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  if (!file) return;
                  await uploadZip(file);
                }}
                className="hidden"
              />
              <span className="text-gray-500">
                {uploadingZip
                  ? "アップロード中..."
                  : "ダウンロード用ZIPを選択"}
              </span>
            </label>

            {downloadUrl && (
              <p className="mt-2 break-all text-xs text-gray-500">
                登録済み：{downloadUrl}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              WebGL版（ブラウザプレイ・任意）
            </label>

            <label className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border bg-white hover:bg-gray-50">
              <input
                type="file"
                accept=".zip"
                disabled={uploadingWebglZip}
                onChange={async (e) => {
                  const file = e.currentTarget.files?.[0];
                  if (!file) return;
                  await uploadWebglZip(file);
                }}
                className="hidden"
              />
              <span className="text-gray-500">
                {uploadingWebglZip
                  ? "アップロード中..."
                  : "WebGL ZIPを選択"}
              </span>
            </label>

            {webglPlayUrl && (
              <p className="mt-2 break-all text-xs text-gray-500">
                登録済み：{webglPlayUrl}
              </p>
            )}
          </div>

          <button
            onClick={onSave}
            className="w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-gray-800"
          >
            保存する
          </button>

          <button
            onClick={deleteGame}
            className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 font-bold text-red-600 hover:bg-red-50"
          >
            このゲームを削除
          </button>

          {message && <p className="text-sm text-blue-600">{message}</p>}
        </div>
      </div>
    </main>
  );
}