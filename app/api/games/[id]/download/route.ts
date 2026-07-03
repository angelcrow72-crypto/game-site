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
    const viewerCreatorId = req.headers.get("x-viewer-creator-id") || "";

    const { data, error } = await supabase
      .from("games")
      .select("creator_id, download_url, download_count")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "ゲームが見つかりません" },
        { status: 404 }
      );
    }

    if (!data.download_url) {
      return NextResponse.json(
        { error: "ダウンロードURLがありません" },
        { status: 400 }
      );
    }

    if (viewerCreatorId && data.creator_id === viewerCreatorId) {
      return NextResponse.json({
        url: data.download_url,
        skipped: true,
        reason: "creator_self_download",
      });
    }

    const currentCount = data.download_count ?? 0;

    const { error: updateError } = await supabase
      .from("games")
      .update({
        download_count: currentCount + 1,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.download_url,
      skipped: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "ダウンロード処理エラー" },
      { status: 500 }
    );
  }
}