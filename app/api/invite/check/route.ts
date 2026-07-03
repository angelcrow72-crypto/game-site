import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "招待コードを入力してください。" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .select("id, code, creator_id, creator_name, is_active, expires_at, used")
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

    if (data.used) {
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

    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: "招待コードの使用処理に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      creatorId: data.creator_id,
      creatorName: data.creator_name,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { error: "招待コードの確認に失敗しました。" },
      { status: 500 }
    );
  }
}