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

    // 招待コードの有効性を確認
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, code, is_active, expires_at, used, single_use")
      .eq("code", code)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "招待コードが正しくありません。" },
        { status: 401 }
      );
    }

    if (!invite.is_active) {
      return NextResponse.json(
        { error: "この招待コードは無効です。" },
        { status: 401 }
      );
    }

    if (invite.single_use && invite.used) {
      return NextResponse.json(
        { error: "この招待コードはすでに使用されています。" },
        { status: 401 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "この招待コードの有効期限は終了しています。" },
        { status: 401 }
      );
    }

    // creatorsテーブルから招待コードに対応する作者を取得
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("invite_code", code)
      .single();

    if (creatorError || !creator) {
      console.error("Creator lookup failed:", creatorError);

      return NextResponse.json(
        { error: "この招待コードに対応する作者情報が見つかりません。" },
        { status: 500 }
      );
    }

    // ログインセッション用の安全なトークンを生成
    const token = crypto.randomBytes(32).toString("hex");

    // セッションの有効期限は7日間
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // creators.id（int8）をcreator_sessions.creator_idへ保存
    const { error: sessionError } = await supabase
      .from("creator_sessions")
      .insert({
        creator_id: creator.id,
        token,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error("Session creation failed:", sessionError);

      return NextResponse.json(
        { error: "ログインセッションの作成に失敗しました。" },
        { status: 500 }
      );
    }

    // 1回限りの招待コードの場合のみ使用済みにする
    if (invite.single_use) {
      const { error: updateError } = await supabase
        .from("invite_codes")
        .update({
          used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", invite.id);

      if (updateError) {
        console.error("Invite update failed:", updateError);

        // 招待コードの更新に失敗した場合は作成したセッションを削除
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

    response.cookies.set("gameverse_creator_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (e) {
    console.error("Invite check failed:", e);

    return NextResponse.json(
      { error: "招待コードの確認に失敗しました。" },
      { status: 500 }
    );
  }
}
