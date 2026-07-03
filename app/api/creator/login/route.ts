import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    return NextResponse.json({
      creator: {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "ログイン処理でエラーが発生しました。" },
      { status: 500 }
    );
  }
}