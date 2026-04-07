export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-gray-900">

      {/* ===== ヘッダー（黒背景・ロゴ＋検索窓） ===== */}
      <header className="bg-black h-28 w-full flex items-center justify-between px-8 shadow-lg">

        {/* 左上ロゴ */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="GAME VERSE ロゴ"
            className="h-40 w-auto"
          />
        </div>

        {/* 中央検索窓（ダミー） */}
        <div className="flex-1 flex justify-center">
          <input
            type="text"
            placeholder="サイト内検索（準備中）"
            className="w-80 px-4 py-2 rounded-full bg-neutral-800 text-gray-200 border border-gray-600 focus:outline-none"
            disabled
          />
        </div>
      </header>

      {/* ===== コンテンツ全体 ===== */}
      <div className="flex flex-1">

        {/* 左メニュー（掲示板） */}
        <aside className="w-56 bg-gray-100 border-r border-gray-300 p-6">
          <h2 className="text-sm font-semibold border-b border-gray-400 mb-4 pb-1">
            掲示板メニュー
          </h2>

          <ul className="text-sm space-y-3">
            <li>
              <a
                href="/board/zatsudan"
                className="text-blue-600 font-bold hover:text-blue-800"
              >
                雑談
              </a>
            </li>
            <li className="text-gray-400 cursor-not-allowed">
              ゲーム攻略・裏技（準備中）
            </li>
            <li className="text-gray-400 cursor-not-allowed">
              その他（準備中）
            </li>
          </ul>
        </aside>

        {/* ===== 中央メイン ===== */}
        <section className="flex-1 flex items-center justify-center text-center bg-white">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              サイト公開準備中
            </h2>

            <p className="text-lg md:text-xl mb-3 text-gray-700">
              Coming Soon
            </p>

            <p className="text-md md:text-lg text-gray-600">
              インディーゲーム投稿・配信プラットフォーム
              <br />
              GAME VERSE は現在開発中です
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
