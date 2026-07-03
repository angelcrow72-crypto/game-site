import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("UPLOAD API START");

    const formData = await req.formData();
    console.log("FORM DATA OK");

    const file = formData.get("file");
    console.log("FILE GET OK", file instanceof File);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "ZIPファイルがありません" },
        { status: 400 }
      );
    }

    console.log("FILE NAME:", file.name);
    console.log("FILE SIZE:", file.size);

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { error: "ZIPファイルのみ対応しています" },
        { status: 400 }
      );
    }

    const maxSize = 500 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ZIPファイルは500MB以下にしてください" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    console.log("UPLOAD TO SUPABASE START");

    const { error } = await supabase.storage
      .from("game-files")
      .upload(fileName, file, {
        contentType: "application/zip",
        upsert: false,
      });

    console.log("UPLOAD TO SUPABASE END");

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from("game-files")
      .getPublicUrl(fileName);

    console.log("PUBLIC URL OK:", data.publicUrl);

    return NextResponse.json({
      url: data.publicUrl,
    });
  } catch (e: any) {
    console.error("UPLOAD GAME ERROR:", e);

    return NextResponse.json(
      {
        error: e?.message ?? "アップロードエラー",
        detail: String(e),
      },
      { status: 500 }
    );
  }
}