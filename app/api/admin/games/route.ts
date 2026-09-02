import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ADMIN_COOKIE_NAME = "gameverse_admin";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const isAdmin = verifyAdminSessionToken(token);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "管理者権限が必要です。",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        title,
        creator,
        download_url,
        browser_play_url,
        webgl_play_url,
        created_at
      `)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin games fetch error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "作品一覧の取得に失敗しました。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        games: data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin games API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "作品一覧の取得中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}