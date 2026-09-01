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

    const body = await req.json();

    const title = String(body?.title ?? "").trim();
    const creator = String(body?.creator ?? "").trim();
    const genre = String(body?.genre ?? "").trim();
    const recommendedAge = String(body?.recommendedAge ?? "").trim();
    const recommendedEnvironment = String(
      body?.recommendedEnvironment ?? ""
    ).trim();
    const description = String(body?.description ?? "").trim();

    const thumbnailUrls = Array.isArray(body?.thumbnailUrls)
      ? body.thumbnailUrls
          .map((url: unknown) => String(url).trim())
          .filter((url: string) => url !== "")
      : [];

    const downloadUrl = String(body?.downloadUrl ?? "").trim();
    const webglPlayUrl = String(body?.webglPlayUrl ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "タイトルを入力してください" },
        { status: 400 }
      );
    }

    // ログイン中の作者本人が所有している作品だけ更新
    const { data: updatedGame, error } = await supabase
      .from("games")
      .update({
        title,
        creator,
        genre,
        recommended_age: recommendedAge,
        recommended_environment: recommendedEnvironment,
        description,
        thumbnail_url: thumbnailUrls[0] ?? "",
        thumbnail_urls: thumbnailUrls,
        download_url: downloadUrl,
        webgl_play_url: webglPlayUrl,
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

    // IDは存在していても、別作者の作品なら更新されない
    if (!updatedGame) {
      return NextResponse.json(
        { error: "このゲームを編集する権限がありません。" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "更新エラー" },
      { status: 500 }
    );
  }
}