type PlayPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">ブラウザプレイ</h1>

          <a
            href={`/game/${id}`}
            className="rounded-lg border border-white px-4 py-2 text-sm hover:bg-white hover:text-black"
          >
            詳細ページへ戻る
          </a>
        </div>

        <div className="overflow-hidden rounded-xl bg-black">
          <iframe
            src={`/api/webgl/${id}/index.html`}
            className="h-[720px] w-full border-0 bg-black"
            allowFullScreen
          />
        </div>
      </div>
    </main>
  );
}