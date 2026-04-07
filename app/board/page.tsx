export default function BoardTopPage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">掲示板</h1>

        <p className="mt-2 text-gray-700">
          ゲーム投稿サイト「GAME VERSE」の掲示板です。
        </p>

        {/* 雑談（メイン） */}
        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">雑談</h2>
          <p className="mt-2 text-sm text-gray-600">
            サイトに関する話題、制作進捗、雑談などはこちら。
          </p>

          <a
            href="/board/zatsudan"
            className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white hover:bg-gray-800"
          >
            雑談掲示板へ
          </a>
        </div>

        {/* 攻略・その他（準備中） */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-gray-50 p-4">
            <h2 className="font-semibold">ゲーム攻略・裏技</h2>
            <p className="mt-2 text-sm text-gray-600">
              各ゲームの攻略情報や小ネタを共有する予定です。
            </p>
            <span className="mt-3 inline-block text-sm text-gray-400">
              準備中
            </span>
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <h2 className="font-semibold">その他</h2>
            <p className="mt-2 text-sm text-gray-600">
              上記以外の話題用カテゴリです。
            </p>
            <span className="mt-3 inline-block text-sm text-gray-400">
              準備中
            </span>
          </div>
        </div>

        {/* 補足 */}
        <div className="mt-6 text-xs text-gray-500">
          ※ 現在はテスト運用中です。内容は予告なく変更される場合があります。
        </div>
      </div>
    </main>
  );
}
