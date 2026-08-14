import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const thumbnailUrls = Array.isArray(body?.thumbnailUrls)
      ? body.thumbnailUrls
        .map((url: unknown) => String(url).trim())
        .filter((url: string) => url !== "")
      : [];
    const downloadUrl = String(body?.downloadUrl ?? "").trim();
    const webglPlayUrl = String(body?.webglPlayUrl ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "タイトルを入力してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("games")
      .update({
        title,
        description,
        thumbnail_url: thumbnailUrls[0] ?? "",
        thumbnail_urls: thumbnailUrls,
        download_url: downloadUrl,
        webgl_play_url: webglPlayUrl,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "更新エラー" },
      { status: 500 }
    );
  }
}