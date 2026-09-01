import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(
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

    // セッションの有効期限を確認
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "ログインセッションの有効期限が切れています。" },
        { status: 401 }
      );
    }

    // ログイン中の作者本人が所有する作品だけ取得
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select("id, delete_reason")
      .eq("id", id)
      .eq("creator_id", session.creator_id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!game) {
      return NextResponse.json(
        { error: "このゲームを再公開する権限がありません。" },
        { status: 403 }
      );
    }

    // 管理者によって非公開化された作品は作者自身では再公開できない
    if (game.delete_reason === "admin") {
      return NextResponse.json(
        { error: "管理者により非公開化された作品は再公開できません" },
        { status: 403 }
      );
    }

    // 本人所有の作品だけ再公開
    const { data: shownGame, error } = await supabase
      .from("games")
      .update({
        deleted: false,
        delete_reason: null,
      })
      .eq("id", id)
      .eq("creator_id", session.creator_id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!shownGame) {
      return NextResponse.json(
        { error: "このゲームを再公開する権限がありません。" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "再公開エラー" },
      { status: 500 }
    );
  }
}