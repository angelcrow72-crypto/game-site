import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/adminAuth";

const ADMIN_COOKIE_NAME = "gameverse_admin";
const ADMIN_SESSION_SECONDS = 60 * 60 * 8; // 8時間

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body?.password ?? "");

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD is not configured");

      return NextResponse.json(
        {
          success: false,
          error: "管理者認証の設定に問題があります。",
        },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "パスワードが違います。",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createAdminSessionToken(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_SESSION_SECONDS,
      }
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ログイン処理中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}