import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        title,
        creator,
        genre,
        recommended_age,
        recommended_environment,
        description,
        play_time,
        endings_count,
        controls,
        streaming_policy,
        thumbnail_url,
        thumbnail_urls,
        download_url,
        browser_play_url,
        webgl_play_url,
        webgl_zip_url,
        view_count,
        created_at
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "ゲームが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "取得エラー" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const adminPass = req.headers.get("x-admin-pass");

    if (adminPass !== process.env.ADMIN_DELETE_PASSWORD) {
      return NextResponse.json(
        { error: "管理者パスワードが違います" },
        { status: 401 }
      );
    }

    const { id } = await ctx.params;

    const { error } = await supabase
      .from("games")
      .update({
        deleted: true,
        delete_reason: "admin",
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "削除エラー" },
      { status: 500 }
    );
  }
}