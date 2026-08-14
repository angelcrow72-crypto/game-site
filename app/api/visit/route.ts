import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const VISIT_COOKIE_NAME = "gameverse_visit_id";
const ADMIN_COOKIE_NAME = "gameverse_admin";
const SESSION_SECONDS = 30 * 60;

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const isAdmin = verifyAdminSessionToken(token);

    // 管理者はアクセス数に含めない
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        skipped: true,
      });
    }

    const existingSessionId =
      request.cookies.get(VISIT_COOKIE_NAME)?.value;

    // 既存セッションがある場合は最終アクセス時刻のみ更新
    if (existingSessionId) {
      const { error } = await supabase
        .from("site_visits")
        .update({
          last_visited_at: new Date().toISOString(),
        })
        .eq("session_id", existingSessionId);

      if (error) {
        console.error("Visit update error:", error);

        return NextResponse.json(
          {
            success: false,
            error: "訪問情報の更新に失敗しました。",
          },
          { status: 500 }
        );
      }

      const response = NextResponse.json({
        success: true,
        newVisit: false,
      });

      // アクセスが続いている間は30分間延長
      response.cookies.set(VISIT_COOKIE_NAME, existingSessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_SECONDS,
      });

      return response;
    }

    // 新しい訪問者として記録
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("site_visits")
      .insert({
        session_id: sessionId,
        first_visited_at: now,
        last_visited_at: now,
        is_admin: false,
      });

    if (error) {
      console.error("Visit insert error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "訪問情報の登録に失敗しました。",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      newVisit: true,
    });

    response.cookies.set(VISIT_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Visit API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "訪問情報の処理中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}

// 管理者ログイン前に記録された自分のアクセスを削除
export async function DELETE(request: NextRequest) {
  try {
    const token =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const isAdmin = verifyAdminSessionToken(token);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "管理者のみ実行できます。",
        },
        { status: 403 }
      );
    }

    const sessionId =
      request.cookies.get(VISIT_COOKIE_NAME)?.value;

    const response = NextResponse.json({
      success: true,
      deleted: false,
    });

    if (!sessionId) {
      return response;
    }

    const { error } = await supabase
      .from("site_visits")
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      console.error("Admin visit delete error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "管理者の訪問記録を削除できませんでした。",
        },
        { status: 500 }
      );
    }

    response.cookies.delete(VISIT_COOKIE_NAME);

    return NextResponse.json(
      {
        success: true,
        deleted: true,
      },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    console.error("Admin visit cleanup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "管理者の訪問記録の削除中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}