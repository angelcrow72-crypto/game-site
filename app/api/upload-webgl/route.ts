import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "WebGL ZIPファイルがありません。" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const indexEntry = Object.values(zip.files).find((entry) => {
      return !entry.dir && entry.name.toLowerCase().endsWith("index.html");
    });

    if (!indexEntry) {
      return NextResponse.json(
        { ok: false, error: "ZIP内に index.html が見つかりません。" },
        { status: 400 }
      );
    }

    const uploadId = crypto.randomUUID();

    const uploadedFiles: string[] = [];

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue;

      const content = await entry.async("uint8array");

      const cleanName = entry.name.replace(/^\/+/, "");
      const storagePath = `${uploadId}/${cleanName}`;

      const { error } = await supabase.storage
        .from("webgl-games")
        .upload(storagePath, content, {
          upsert: true,
          contentType: getContentType(cleanName),
        });

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      uploadedFiles.push(storagePath);
    }

    const indexPath = `${uploadId}/${indexEntry.name.replace(/^\/+/, "")}`;

    const { data } = supabase.storage
      .from("webgl-games")
      .getPublicUrl(indexPath);

    return NextResponse.json({
      ok: true,
      webgl_play_url: data.publicUrl,
      uploaded_count: uploadedFiles.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "WebGL ZIPアップロード中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

function getContentType(filename: string) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".js")) return "application/javascript";
  if (lower.endsWith(".wasm")) return "application/wasm";
  if (lower.endsWith(".data")) return "application/octet-stream";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}