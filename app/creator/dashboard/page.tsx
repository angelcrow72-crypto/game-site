"use client";

import { useEffect, useState } from "react";

type Game = {
  id: number;
  title: string;
  creator: string;
  genre?: string;
  recommended_age?: string;
  description?: string;
  thumbnail_url?: string;
  download_url?: string;
  browser_play_url?: string;
  webgl_zip_url?: string;
  created_at?: string;
  deleted?: boolean;
  delete_reason?: string;
  view_count?: number;
  download_count?: number;
};

export default function CreatorDashboardPage() {
  const [creatorId, setCreatorId] = useState("");
  const [creatorName, setCreatorName] = useState("");

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("ホラー");
  const [customGenre, setCustomGenre] = useState("");
  const [recommendedAge, setRecommendedAge] = useState("全年齢");
  const [recommendedEnvironment, setRecommendedEnvironment] = useState("");
  const [description, setDescription] = useState("");

  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([""]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [browserPlayUrl, setBrowserPlayUrl] = useState("");
  const [webglZipUrl, setWebglZipUrl] = useState("");
  const [uploadingWebglZip, setUploadingWebglZip] = useState(false);

  const [message, setMessage] = useState("");
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("gameverse_creator_id") || "";
    const name = localStorage.getItem("gameverse_creator_name") || "";

    if (!id) {
      location.href = "/creator/login";
      return;
    }

    setCreatorId(id);
    setCreatorName(name);

    loadMyGames(id);
  }, []);

  async function loadMyGames(id: string) {
    try {
      const res = await fetch(`/api/creator/games?creatorId=${id}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setMyGames(data);
      } else {
        console.log("myGames is not array:", data);
        setMyGames([]);
      }
    } catch (e) {
      console.error(e);
      setMyGames([]);
    }
  }

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

  const uploadThumbnail = async (file: File) => {
    setUploadingImage(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/thumbnail", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "画像アップロードに失敗しました");
        return;
      }

      setThumbnailUrls((prev) => {
        if (prev.length === 1 && prev[0] === "") {
          return [json.url];
        }
        return [...prev, json.url];
      });

      setMessage("画像をアップロードしました。");
    } catch {
      setMessage("画像アップロード中に通信エラーが発生しました");
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadZip = async (file: File) => {
    setUploadingZip(true);
    setMessage("");

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
      setMessage("ZIPファイルをアップロードしました。");
    } catch {
      setMessage("ZIPアップロード中に通信エラーが発生しました");
    } finally {
      setUploadingZip(false);
    }
  };

    const uploadWebGLZip = async (file: File) => {
      setUploadingWebglZip(true);
      setMessage("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/webgl", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setMessage(json?.error ?? "WebGL ZIPアップロードに失敗しました");
          return;
        }

        setWebglZipUrl(json.url);
        setBrowserPlayUrl(json.webglIndexUrl ?? json.url);
        setMessage("WebGL ZIPをアップロードしました。ブラウザプレイURLを自動入力しました。");
      } catch {
        setMessage("WebGL ZIPアップロード中に通信エラーが発生しました");
      } finally {
        setUploadingWebglZip(false);
      }
    };

  const onSubmit = async () => {
    if (!title.trim()) {
      setMessage("ゲームタイトルを入力してください");
      return;
    }

    if (!downloadUrl.trim() && !browserPlayUrl.trim()) {
      setMessage("ダウンロード用ZIPまたはブラウザ版のどちらかを登録してください");
      return;
    }

    const finalGenre =
      genre === "その他" ? customGenre.trim() || "その他" : genre;

    const cleanedThumbnailUrls = thumbnailUrls
      .map((url) => url.trim())
      .filter(Boolean);

    const mainThumbnailUrl = cleanedThumbnailUrls[0] || "";

    setMessage("");

    try {
      const res = await fetch("/api/creator/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId,
          title: title.trim(),
          creator: creatorName,
          genre: finalGenre,
          recommendedAge,
          recommendedEnvironment,
          description: description.trim(),
          playTime: "",
          endingsCount: "",
          controls: "",
          streamingPolicy: "",
          thumbnailUrl: mainThumbnailUrl,
          thumbnailUrls: cleanedThumbnailUrls,
          downloadUrl: downloadUrl.trim(),
          browserPlayUrl: browserPlayUrl.trim(),
          webglZipUrl: webglZipUrl.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json?.error ?? "投稿に失敗しました");
        return;
      }

      setMessage("投稿しました。トップページに反映されます。");
      loadMyGames(creatorId);

      setTitle("");
      setGenre("ホラー");
      setCustomGenre("");
      setRecommendedAge("全年齢");
      setRecommendedEnvironment("");
      setDescription("");
      setThumbnailUrls([""]);
      setDownloadUrl("");
      setBrowserPlayUrl("");
      setWebglZipUrl("");
    } catch {
      setMessage("通信エラーが発生しました");
    }
  };

  const hideGame = async (gameId: number) => {
    const ok = confirm("このゲームを非公開にしますか？");
    if (!ok) return;

    try {
      const res = await fetch(`/api/creator/games/${gameId}/hide`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error ?? "非公開に失敗しました");
        return;
      }

      alert("非公開にしました");
      loadMyGames(creatorId);
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  const showGame = async (gameId: number) => {
    const ok = confirm("このゲームを再公開しますか？");
    if (!ok) return;

    try {
      const res = await fetch(`/api/creator/games/${gameId}/show`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error ?? "再公開に失敗しました");
        return;
      }

      alert("再公開しました");
      loadMyGames(creatorId);
    } catch {
      alert("通信エラーが発生しました");
    }
  };

  const onLogout = () => {
    localStorage.removeItem("creatorId");
    localStorage.removeItem("creatorName");
    location.href = "/creator/login";
  };

  return (
    <main className="min-h-screen bg-gray-100 p-2">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">クリエイターページ</h1>
          </div>

          <button
            onClick={onLogout}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>

        <section className="mt-3 rounded-xl border p-3">
          <div className="flex gap-4">
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
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
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
                    placeholder="例：Windows 10/11、メモリ4GB以上"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold">作品紹介</h2>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-3 w-full rounded-lg border px-4 py-2"
                style={{
                  height: "380px",
                  resize: "none",
                }}
                placeholder="ゲーム紹介、想定プレイ時間、ED数、操作方法、実況・配信許諾等を自由に入力してください。"
              />
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-xl border p-3">
          <h2 className="text-xl font-bold">素材・配布</h2>

          <div className="mt-2 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  サムネ画像アップロード（任意・複数可）
                </label>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      uploadThumbnail(file);
                      e.target.value = "";
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />

                  <div className="flex h-[42px] w-full items-center justify-center rounded-lg border bg-white hover:bg-gray-50">
                    {uploadingImage
                      ? "アップロード中..."
                      : "サムネ画像を選択"}
                  </div>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  PNG / JPG / WEBP、5MB以下。
                </p>
              </div>

              <div>
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
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border bg-gray-50 p-4">
                <h3 className="mb-4 text-lg font-bold">ダウンロード版</h3>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    ZIPファイル（任意）
                  </label>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".zip"
                      disabled={uploadingZip}
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        if (!file) return;

                        setMessage(`ZIP選択済み：${file.name}`);

                        await uploadZip(file);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />

                    <div className="flex h-[42px] w-full items-center justify-center rounded-lg border bg-white hover:bg-gray-50">
                      {uploadingZip
                        ? "アップロード中..."
                        : "ZIPファイルを選択"}
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Windows版・Mac版など、ダウンロードして遊ぶゲームはこちら。
                  </p>
                </div>

                <div className="my-3 text-center text-xs text-gray-400">
                  または
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    外部ダウンロードURL（任意）
                  </label>

                  <input
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder="https://..."
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Google Drive、BOOTHなど外部サイトで公開している場合のみ入力してください。
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-gray-50 p-4">
                <h3 className="mb-4 text-lg font-bold">ブラウザ版</h3>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    WebGL ZIP（任意）
                  </label>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".zip"
                      disabled={uploadingWebglZip}
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        if (!file) return;

                        setMessage(`WebGL ZIP選択済み：${file.name}`);

                        await uploadWebGLZip(file);

                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />

                    <div className="flex h-[42px] w-full items-center justify-center rounded-lg border bg-white hover:bg-gray-50">
                      {uploadingWebglZip ? "アップロード中..." : "WebGL ZIPを選択"}
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Unity WebGLとして出力したフォルダをZIPにしてアップロードしてください。
                  </p>
                </div>

                <div className="my-3 text-center text-xs text-gray-400">
                  または
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    ブラウザで遊べるURL（任意）
                  </label>

                  <input
                    value={browserPlayUrl}
                    onChange={(e) => setBrowserPlayUrl(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder="https://..."
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Unity WebGL、HTML5ゲーム、ティラノスクリプトなど、
                    ブラウザで公開済みのゲームURLを入力してください。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={onSubmit}
              className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white hover:bg-gray-800"
            >
              投稿する
            </button>

            {message && (
              <p className="mt-2 text-sm text-blue-600">
                {message}
              </p>
            )}
          </div>
        </section>

        <section className="mt-3 rounded-xl border p-3">

          {myGames.length === 0 ? (
            <div className="text-gray-500">
              まだ投稿されたゲームはありません。
            </div>
          ) : (
            <div className="space-y-3">
              {myGames.map((game) => (
                <div
                  key={game.id}
                  className="flex gap-4 rounded-xl border bg-white p-3"
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-lg bg-gray-200"
                    style={{
                      width: "280px",
                      height: "158px",
                    }}
                  >
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                        サムネ未設定
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold">
                        {game.title}
                      </div>

                      <span className="text-xs text-gray-500">
                        {game.created_at
                          ? `${new Date(game.created_at).toLocaleDateString("ja-JP")} 投稿`
                          : "投稿日未設定"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      <span>アクセス数：{game.view_count ?? 0}</span>
                      {" "}
                      <span>DL数：{game.download_count ?? 0}</span>
                      {" "}
                    </div>

                    <div className="mt-2 flex gap-2 text-xs">
                      {game.browser_play_url && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                          ブラウザ対応
                        </span>
                      )}

                      {game.webgl_zip_url && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                          WebGL ZIPあり
                        </span>
                      )}

                      {game.download_url && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                          DL対応
                        </span>
                      )}
                    </div>

                    {game.deleted && (
                      <div
                        className={`mt-2 inline-block w-fit rounded-lg px-3 py-1 text-sm font-bold ${
                          game.delete_reason === "admin"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {game.delete_reason === "admin"
                          ? "管理者により非公開"
                          : "作者により非公開"}
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      <a
                        href={`/game/${game.id}`}
                        target="_blank"
                        className="flex items-center justify-center whitespace-nowrap rounded-lg bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
                        style={{ width: "120px" }}
                      >
                        詳細ページへ
                      </a>

                      <a
                        href={`/creator/edit/${game.id}`}
                        className="flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                        style={{ width: "120px" }}
                      >
                        編集する
                      </a>

                      {!game.deleted && (
                        <button
                          onClick={() => hideGame(game.id)}
                          className="flex items-center justify-center whitespace-nowrap rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          style={{ width: "120px" }}
                        >
                          非公開にする
                        </button>
                      )}

                      {game.deleted && game.delete_reason === "creator" && (
                        <button
                          onClick={() => showGame(game.id)}
                          className="flex items-center justify-center whitespace-nowrap rounded-lg border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                          style={{ width: "120px" }}
                        >
                          再公開する
                        </button>
                      )}
                    </div>
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