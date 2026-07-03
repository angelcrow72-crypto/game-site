import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  return "application/octet-stream";
}

function getContentEncoding(path: string) {
  const lower = path.toLowerCase();

  if (lower.endsWith(".gz")) return "gzip";
  if (lower.endsWith(".br")) return "br";

  return "";
}

function getUnityContentType(path: string) {
  const lower = path.toLowerCase();

  if (lower.endsWith(".js.gz") || lower.endsWith(".js.br")) {
    return "application/javascript";
  }

  if (lower.endsWith(".wasm.gz") || lower.endsWith(".wasm.br")) {
    return "application/wasm";
  }

  if (lower.endsWith(".data.gz") || lower.endsWith(".data.br")) {
    return "application/octet-stream";
  }

  if (lower.endsWith(".symbols.json.gz") || lower.endsWith(".symbols.json.br")) {
    return "application/json";
  }

  return getContentType(path);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> }
) {
  try {
    const { id, path } = await ctx.params;

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, webgl_play_url, browser_play_url, webgl_zip_url")
      .eq("id", id)
      .single();

    const sourceUrl =
      game?.webgl_play_url || game?.browser_play_url || game?.webgl_zip_url || "";

    if (gameError || !sourceUrl) {
      return NextResponse.json(
        { error: "WebGLファイルが見つかりません" },
        { status: 404 }
      );
    }

    const marker = "/game-files/";
    const markerIndex = sourceUrl.indexOf(marker);

    if (markerIndex === -1) {
      return NextResponse.json(
        { error: "WebGL URLの形式が不正です" },
        { status: 500 }
      );
    }

    const indexStoragePath = decodeURIComponent(
      sourceUrl.slice(markerIndex + marker.length)
    );

    const basePath = indexStoragePath.replace(/index\.html$/i, "");
    const requestedPath = path.join("/");

    if (requestedPath.includes("..")) {
      return NextResponse.json({ error: "不正なパスです" }, { status: 400 });
    }

    const storagePath = `${basePath}${requestedPath}`;

    const { data, error } = await supabase.storage
      .from("game-files")
      .download(storagePath);

    if (error || !data) {
      return NextResponse.json(
        { error: "ファイルが見つかりません", storagePath },
        { status: 404 }
      );
    }

    const headers = new Headers();

    headers.set("Content-Type", getUnityContentType(storagePath));
    headers.set("Cache-Control", "public, max-age=3600");

    const encoding = getContentEncoding(storagePath);

    if (encoding) {
      headers.set("Content-Encoding", encoding);
    }

    return new NextResponse(data, {
      headers,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "WebGL配信エラー" },
      { status: 500 }
    );
  }
}