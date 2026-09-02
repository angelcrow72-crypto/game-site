"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Game = {
  id: number;
  title: string;
  creator?: string;
  genre?: string;
  recommended_age?: string;
  recommended_environment?: string;
  description?: string;
  thumbnail_url?: string;
  thumbnail_urls?: string[];
  download_url?: string;
  webgl_play_url?: string;
};

const GENRE_OPTIONS = [
  "ホラー",
  "RPG",
  "アドベンチャー",
  "ノベル",
  "アクション",
  "シューティング",
  "パズル",
  "シミュレーション",
  "その他",
];

const AGE_OPTIONS = [
  "全年齢",
  "12歳以上",
  "15歳以上",
  "17歳以上",
];

export default function CreatorEditPage() {
  const pathname = usePathname();
  const gameId = pathname.split("/").pop();

  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [recommendedAge, setRecommendedAge] = useState("");
  const [recommendedEnvironment, setRecommendedEnvironment] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([""]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [webglPlayUrl, setWebglPlayUrl] = useState("");

  const [uploadingZip, setUploadingZip] = useState(false);
  const [uploadingWebglZip, setUploadingWebglZip] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!gameId) return;

    const loadGame = async () => {
      try {
        const res = await fetch(`/api/creator/games/${gameId}`);
        const data = await res.json();

        // 未ログイン・セッション切れ
        if (res.status === 401) {
          location.href = "/creator/login";
          return;
        }

        // ログインしているが、他作者の作品
        if (res.status === 403) {
          alert("このゲームを編集する権限がありません。");
          location.href = "/creator/dashboard";
          return;
        }

        if (!res.ok) {
          setMessage(data?.error ?? "ゲーム情報の取得に失敗しました");
          return;
        }

        const game: Game = data;

        setTitle(game.title || "");
        setCreator(game.creator || "");

        const savedGenre = game.genre || "";

        if (GENRE_OPTIONS.includes(savedGenre)) {
          setGenre(savedGenre);
          setCustomGenre("");
        } else if (savedGenre) {
          setGenre("その他");
          setCustomGenre(savedGenre);
        } else {
          setGenre("ホラー");
          setCustomGenre("");
        }

        setRecommendedAge(game.recommended_age || "全年齢");
        setRecommendedEnvironment(game.recommended_environment || "");
        setDescription(game.description || "");

        setThumbnailUrls(
          Array.isArray(game.thumbnail_urls) && game.thumbnail_urls.length > 0
            ? game.thumbnail_urls
            : game.thumbnail_url
              ? [game.thumbnail_url]
              : [""]
        );

        setDownloadUrl(game.download_url || "");
        setWebglPlayUrl(game.webgl_play_url || "");
      } catch {
        setMessage("ゲーム情報の取得に失敗しました");
      }
    };

    loadGame();
  }, [gameId]);

  const updateThumbnailUrl = (index: number, value: string) => {
    const next = [...thumbnailUrls];
    next[index] = value;
    setThumbnailUrls(next);
  };

  const addThumbnailUrl = () => {
    setThumbnailUrls([...thumbnailUrls, ""]);
  };

  const removeThumbnailUrl = (index: number) => {
    if (thumbnailUrls.length === 1) return;
    setThumbnailUrls(thumbnailUrls.filter((_, i) => i !== index));
  };

const uploadZip = async (file: File) => {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    setMessage("ZIPファイルのみアップロードできます");
    return;
  }

  if (file.size > 2 * 1024 * 1024 * 1024) {
    setMessage("ZIPファイルは2GB以下にしてください");
    return;
  }

  setUploadingZip(true);
  setMessage("ダウンロード用ZIPをアップロード中...");

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from("game-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/zip",
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("game-files")
      .getPublicUrl(data.path);

    if (!publicUrlData.publicUrl) {
      throw new Error("ダウンロードURLの取得に失敗しました");
    }

    setDownloadUrl(publicUrlData.publicUrl);
    setMessage(
      "ダウンロード用ZIPをアップロードしました。保存ボタンを押してください。"
    );
  } catch (error) {
    console.error("ZIP UPLOAD ERROR:", error);

    setMessage(
      error instanceof Error
        ? error.message
        : "ZIPアップロード中にエラーが発生しました"
    );
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
        throw new Error(
          result.error || "WebGL ZIPのアップロードに失敗しました"
        );
      }

      setWebglPlayUrl(result.webgl_play_url);
      setMessage(
        "WebGL ZIPをアップロードしました。保存ボタンを押してください。"
      );
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

    if (!creator.trim()) {
      setMessage("作者名を入力してください");
      return;
    }

    if (genre === "その他" && !customGenre.trim()) {
      setMessage("ジャンルを入力してください");
      return;
    }

    const genreToSave =
      genre === "その他" ? customGenre.trim() : genre.trim();

    setMessage("保存中...");

    try {
      const res = await fetch(`/api/creator/games/${gameId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          creator: creator.trim(),
          genre: genreToSave,
          recommendedAge: recommendedAge.trim(),
          recommendedEnvironment: recommendedEnvironment.trim(),
          description: description.trim(),
          thumbnailUrls: thumbnailUrls
            .map((url) => url.trim())
            .filter((url) => url !== ""),
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
    <main className="min-h-screen bg-gray-100 p-2">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-4 shadow">
        <a
          href="/creator/dashboard"
          className="text-blue-600 hover:underline"
        >
          ← クリエイターページへ戻る
        </a>

        <h1 className="mt-4 text-3xl font-bold">作品情報を編集</h1>

        <section className="mt-4 rounded-xl border p-3">
          <div className="flex gap-4">
            {/* 左側：基本情報 */}
            <div className="w-[260px] shrink-0">
              <h2 className="text-xl font-bold">基本情報</h2>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    ゲームタイトル
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    作者名
                  </label>
                  <input
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder="作者名を入力してください"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    ゲームジャンル
                  </label>

                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  >
                    <option>ホラー</option>
                    <option>RPG</option>
                    <option>アドベンチャー</option>
                    <option>ノベル</option>
                    <option>アクション</option>
                    <option>シューティング</option>
                    <option>パズル</option>
                    <option>シミュレーション</option>
                    <option>その他</option>
                  </select>

                  {genre === "その他" && (
                    <input
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="mt-3 w-full rounded-lg border px-4 py-2"
                      placeholder="ジャンルを入力してください"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    推奨年齢
                  </label>

                  <select
                    value={recommendedAge}
                    onChange={(e) => setRecommendedAge(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                  >
                    <option>全年齢</option>
                    <option>12歳以上</option>
                    <option>15歳以上</option>
                    <option>17歳以上</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    推奨環境
                  </label>
                  <input
                    value={recommendedEnvironment}
                    onChange={(e) =>
                      setRecommendedEnvironment(e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder="例：Windows 10 / 11"
                  />
                </div>
              </div>
            </div>

            {/* 右側：作品紹介 */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">作品紹介</h2>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-3 h-[360px] w-full rounded-lg border px-4 py-3"
                style={{
                  resize: "none",
                  minHeight: "360px",
                }}
                placeholder="ゲーム紹介、想定プレイ時間、ED数、操作方法、実況・配信許諾等を自由に入力してください。"
              />
            </div>
          </div>
        </section>

        {/* サムネイル */}
        <section className="mt-3 rounded-xl border p-3">
          <h2 className="text-xl font-bold">素材・配布</h2>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold">
              サムネURL（任意・複数可）
            </label>

            <div className="space-y-2">
              {thumbnailUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) =>
                      updateThumbnailUrl(index, e.target.value)
                    }
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder={`サムネURL ${index + 1}`}
                  />

                  {thumbnailUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeThumbnailUrl(index)}
                      className="rounded-lg border px-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={addThumbnailUrl}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                ＋ サムネURLを追加
              </button>

              <p className="text-xs text-gray-500">
                1枚目がトップページのサムネとして表示されます。
              </p>
            </div>
          </div>

          {/* ダウンロード版 */}
          <div className="mt-6">
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
              <div className="mt-2">
                <p className="break-all text-xs text-gray-500">
                  登録済み：{downloadUrl}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (!webglPlayUrl) {
                      setMessage(
                        "ブラウザ版が登録されていないため、ダウンロード版は削除できません。"
                      );
                      return;
                    }

                    setDownloadUrl("");
                    setMessage(
                      "ダウンロード版を削除対象にしました。保存ボタンを押してください。"
                    );
                  }}
                  className="mt-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ダウンロード版を削除
                </button>
              </div>
            )}
          </div>

          {/* ブラウザ版 */}
          <div className="mt-6">
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
              <div className="mt-2">
                <p className="break-all text-xs text-gray-500">
                  登録済み：{webglPlayUrl}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (!downloadUrl) {
                      setMessage(
                        "ダウンロード版が登録されていないため、ブラウザ版は削除できません。"
                      );
                      return;
                    }

                    setWebglPlayUrl("");
                    setMessage(
                      "ブラウザ版を削除対象にしました。保存ボタンを押してください。"
                    );
                  }}
                  className="mt-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  ブラウザ版を削除
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onSave}
            className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-bold text-white hover:bg-gray-800"
          >
            保存する
          </button>

          <button
            onClick={deleteGame}
            className="mt-3 w-full rounded-lg border border-red-300 bg-white px-4 py-3 font-bold text-red-600 hover:bg-red-50"
          >
            このゲームを削除
          </button>

          {message && (
            <p className="mt-3 text-sm text-blue-600">{message}</p>
          )}
        </section>
      </div>
    </main>
  );
}