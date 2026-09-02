import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ADMIN_COOKIE_NAME = "gameverse_admin";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select(
        "id, title, download_url, browser_play_url, webgl_play_url"
      )
      .eq("id", id)
      .eq("deleted", false)
      .maybeSingle();

    if (fetchError) {
      console.error("Game fetch error:", fetchError);

      return NextResponse.json(
        {
          success: false,
          error: "ゲーム情報の取得に失敗しました。",
        },
        { status: 500 }
      );
    }

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "ゲームが見つかりません。",
        },
        { status: 404 }
      );
    }

    if (!game.browser_play_url) {
      return NextResponse.json(
        {
          success: false,
          error: "このゲームには外部ブラウザ版が登録されていません。",
        },
        { status: 400 }
      );
    }

    if (!game.download_url && !game.webgl_play_url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "他のプレイ方法が登録されていないため、ブラウザ版は削除できません。",
        },
        { status: 400 }
      );
    }

    const browserPlayUrl = game.browser_play_url.trim();
    const webglPlayUrl = game.webgl_play_url?.trim() ?? "";

    const updateData: {
      browser_play_url: null;
      webgl_play_url?: null;
    } = {
      browser_play_url: null,
    };

    if (webglPlayUrl && webglPlayUrl === browserPlayUrl) {
      updateData.webgl_play_url = null;
    }

    const { error: updateError } = await supabase
      .from("games")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Browser version removal error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: "ブラウザ版の削除に失敗しました。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ブラウザ版を削除しました。",
    });
  } catch (error) {
    console.error("Remove browser version API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ブラウザ版の削除中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}