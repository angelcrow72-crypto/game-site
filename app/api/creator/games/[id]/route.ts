import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // HttpOnly Cookieからセッショントークンを取得
    const token = req.cookies.get("gameverse_creator_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 }
      );
    }

    // セッションを確認
    const { data: session, error: sessionError } = await supabase
      .from("creator_sessions")
      .select("creator_id, expires_at")
      .eq("token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "ログインセッションが無効です。" },
        { status: 401 }
      );
    }

    // 有効期限を確認
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "ログインセッションの有効期限が切れています。" },
        { status: 401 }
      );
    }

    // ログイン中の作者本人が所有するゲームだけ取得
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select(`
        id,
        title,
        creator,
        creator_id,
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
      .eq("creator_id", session.creator_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "このゲームを編集する権限がありません。" },
        { status: 403 }
      );
    }

    return NextResponse.json(game);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "取得エラー" },
      { status: 500 }
    );
  }
}