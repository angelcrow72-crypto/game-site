import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();

    if (
      typeof fileName !== "string" ||
      !fileName.toLowerCase().endsWith(".zip")
    ) {
      return NextResponse.json(
        { error: "有効なZIPファイル名が必要です。" },
        { status: 400 }
      );
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from("game-files")
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("SIGNED UPLOAD URL ERROR:", error);

      return NextResponse.json(
        { error: error?.message ?? "アップロードURLの発行に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      path,
      token: data.token,
    });
  } catch (error) {
    console.error("UPLOAD SIGN ERROR:", error);

    return NextResponse.json(
      { error: "アップロードURLの発行に失敗しました。" },
      { status: 500 }
    );
  }
}