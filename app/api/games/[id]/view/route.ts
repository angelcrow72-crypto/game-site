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
      .select("id, creator_id, view_count")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "ゲームが見つかりません" },
        { status: 404 }
      );
    }

    if (viewerCreatorId && data.creator_id === viewerCreatorId) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "creator_self_view",
      });
    }

    const { error: updateError } = await supabase
      .from("games")
      .update({
        view_count: (data.view_count ?? 0) + 1,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skipped: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "view update error" },
      { status: 500 }
    );
  }
}