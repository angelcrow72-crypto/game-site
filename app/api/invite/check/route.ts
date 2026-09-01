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
    const code = String(body?.code ?? "").trim();

    if (!code) {
      return NextResponse.json(
        { error: "招待コードを入力してください。" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .select(
        "id, code, creator_id, creator_name, is_active, expires_at, used, single_use"
      )
      .eq("code", code)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "招待コードが正しくありません。" },
        { status: 401 }
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { error: "この招待コードは無効です。" },
        { status: 401 }
      );
    }

    if (data.single_use && data.used) {
      return NextResponse.json(
        { error: "この招待コードはすでに使用されています。" },
        { status: 401 }
      );
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "この招待コードの有効期限は終了しています。" },
        { status: 401 }
      );
    }

    if (!data.creator_id) {
      return NextResponse.json(
        { error: "この招待コードには作者情報が設定されていません。" },
        { status: 500 }
      );
    }

    // 推測困難なセッショントークンを生成
    const token = crypto.randomBytes(32).toString("hex");

    // セッションの有効期限：7日間
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // creator_sessions にログインセッションを作成
    const { error: sessionError } = await supabase
      .from("creator_sessions")
      .insert({
        creator_id: data.creator_id,
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

    // single_use の招待コードだけ使用済みにする
    if (data.single_use) {
      const { error: updateError } = await supabase
        .from("invite_codes")
        .update({
          used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) {
        console.error(updateError);

        // セッションだけ残らないように削除
        await supabase
          .from("creator_sessions")
          .delete()
          .eq("token", token);

        return NextResponse.json(
          { error: "招待コードの使用処理に失敗しました。" },
          { status: 500 }
        );
      }
    }

    const response = NextResponse.json({
      ok: true,
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
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { error: "招待コードの確認に失敗しました。" },
      { status: 500 }
    );
  }
}