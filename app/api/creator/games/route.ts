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
    const genre = String(body?.genre ?? "").trim();
    const recommendedAge = String(body?.recommendedAge ?? "").trim();
    const recommendedEnvironment = String(
      body?.recommendedEnvironment ?? ""
    ).trim();
    const description = String(body?.description ?? "").trim();
    const playTime = String(body?.playTime ?? "").trim();
    const endingsCount = String(body?.endingsCount ?? "").trim();
    const controls = String(body?.controls ?? "").trim();
    const streamingPolicy = String(body?.streamingPolicy ?? "").trim();
    const thumbnailUrl = String(body?.thumbnailUrl ?? "").trim();
    const thumbnailUrls = Array.isArray(body?.thumbnailUrls)
      ? body.thumbnailUrls
      : thumbnailUrl
      ? [thumbnailUrl]
      : [];
    const downloadUrl = String(body?.downloadUrl ?? "").trim();
    const browserPlayUrl = String(body?.browserPlayUrl ?? "").trim();
    const webglZipUrl = String(body?.webglZipUrl ?? "").trim();

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

    if (!downloadUrl && !browserPlayUrl && !webglZipUrl) {
      return NextResponse.json(
        { error: "ダウンロード版またはブラウザ版のファイル・URLを入力してください" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("games").insert({
      title,
      creator,
      creator_id: creatorId,
      creator_name: creator,
      genre,
      recommended_age: recommendedAge,
      recommended_environment: recommendedEnvironment,
      description,
      play_time: playTime,
      endings_count: endingsCount,
      controls,
      streaming_policy: streamingPolicy,
      thumbnail_url: thumbnailUrl,
      thumbnail_urls: thumbnailUrls,
      download_url: downloadUrl,
      browser_play_url: browserPlayUrl,
      webgl_play_url: browserPlayUrl,
      webgl_zip_url: webglZipUrl,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "投稿エラー" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get("creatorId");

  if (!creatorId) {
    return NextResponse.json(
      { error: "creatorId がありません" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("games")
    .select(`
      id,
      title,
      creator,
      genre,
      recommended_age,
      description,
      thumbnail_url,
      download_url,
      browser_play_url,
      webgl_play_url,
      webgl_zip_url,
      created_at,
      deleted,
      delete_reason,
      view_count,
      download_count,
      creator_id
    `)
    .eq("creator_id", creatorId)
    .or("deleted.is.null,deleted.eq.false")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}