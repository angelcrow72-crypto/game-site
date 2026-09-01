import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
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

    // セッションに紐づく作者情報を取得
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id, name, display_name")
      .eq("id", session.creator_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "作者情報が見つかりません。" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      creator: {
        id: creator.id,
        name: creator.name,
        display_name: creator.display_name,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "ログイン情報の取得に失敗しました。" },
      { status: 500 }
    );
  }
}