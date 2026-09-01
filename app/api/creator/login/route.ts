import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inviteCode = String(body?.inviteCode ?? "").trim();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "招待コードを入力してください。" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("creators")
      .select("id, name, display_name, invite_code")
      .eq("invite_code", inviteCode)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "招待コードが正しくありません。" },
        { status: 401 }
      );
    }

    // 推測困難なセッショントークンを生成
    const token = crypto.randomBytes(32).toString("hex");

    // セッションの有効期限：7日間
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: sessionError } = await supabase
      .from("creator_sessions")
      .insert({
        creator_id: data.id,
        token,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error(sessionError);

      return NextResponse.json(
        { error: "ログインセッションの作成に失敗しました。" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      creator: {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
      },
    });

    // JavaScriptから読み取れないHttpOnly Cookieとして保存
    response.cookies.set("gameverse_creator_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "ログイン処理でエラーが発生しました。" },
      { status: 500 }
    );
  }
}