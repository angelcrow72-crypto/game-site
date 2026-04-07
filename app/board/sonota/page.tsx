export default function SonotaPage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">その他</h1>

        <div className="mt-4 rounded-lg border bg-gray-50 p-4 text-gray-700">
          <p className="font-semibold">このカテゴリは準備中です。</p>
          <p className="mt-2 text-sm text-gray-600">
            まずは雑談カテゴリで掲示板の動作を固めています。
          </p>

          <a
            className="mt-4 inline-block rounded-lg border px-4 py-2 hover:bg-white"
            href="/board/zatsudan"
          >
            雑談へ戻る
          </a>
        </div>
      </div>
    </main>
  );
}
