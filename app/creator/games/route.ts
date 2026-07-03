import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const creatorId = String(body?.creatorId ?? "");
    const title = String(body?.title ?? "").trim();
    const creator = String(body?.creator ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const thumbnailUrl = String(body?.thumbnailUrl ?? "").trim();

    if (!creatorId) {
      return NextResponse.json(
        { error: "ログイン情報がありません" },
        { status: 401 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "タイトルを入力してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("games")
      .insert({
        title,
        creator,
        description,
        thumbnail_url: thumbnailUrl,
      });

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
      {
        error: e?.message ?? "投稿エラー"
      },
      {
        status: 500
      }
    );
  }
}