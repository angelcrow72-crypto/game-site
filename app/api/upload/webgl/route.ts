import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function getContentType(path: string) {
  const lower = path.toLowerCase();

  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".js")) return "application/javascript";
  if (lower.endsWith(".wasm")) return "application/wasm";
  if (lower.endsWith(".data")) return "application/octet-stream";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".symbols.json")) return "application/json";

  return "application/octet-stream";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "WebGL ZIPファイルがありません" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { error: "WebGL ZIPファイルのみ対応しています" },
        { status: 400 }
      );
    }

    const maxSize = 500 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "WebGL ZIPファイルは500MB以下にしてください" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const files = Object.values(zip.files).filter((entry) => !entry.dir);

    const indexFile = files.find((entry) =>
      entry.name.toLowerCase().endsWith("index.html")
    );

    if (!indexFile) {
      return NextResponse.json(
        {
          error:
            "index.html が見つかりません。WebGLビルドの中身をZIP化してください。",
        },
        { status: 400 }
      );
    }

    const rootPrefix = indexFile.name.replace(/index\.html$/i, "");

    const uploadId = `${Date.now()}-${crypto.randomUUID()}`;
    const basePath = `webgl/${uploadId}`;

    let uploadedCount = 0;

    for (const entry of files) {
      if (!entry.name.startsWith(rootPrefix)) continue;

      const relativePath = entry.name.slice(rootPrefix.length);

      if (!relativePath || relativePath.includes("..")) continue;

      const content = await entry.async("uint8array");
      const storagePath = `${basePath}/${relativePath}`;

      const { error } = await supabase.storage
        .from("game-files")
        .upload(storagePath, content, {
          contentType: getContentType(relativePath),
          upsert: false,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      uploadedCount += 1;
    }

    if (uploadedCount === 0) {
      return NextResponse.json(
        { error: "アップロードできるWebGLファイルが見つかりませんでした" },
        { status: 400 }
      );
    }

    const { data } = supabase.storage
      .from("game-files")
      .getPublicUrl(`${basePath}/index.html`);

    return NextResponse.json({
      url: data.publicUrl,
      webglIndexUrl: data.publicUrl,
      uploadedCount,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message ?? "WebGL ZIPアップロードエラー",
        detail: String(e),
      },
      { status: 500 }
    );
  }
}