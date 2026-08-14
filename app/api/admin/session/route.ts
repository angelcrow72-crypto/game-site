import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

const ADMIN_COOKIE_NAME = "gameverse_admin";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    const isAdmin = verifyAdminSessionToken(token);

    return NextResponse.json({
      success: true,
      isAdmin,
    });
  } catch (error) {
    console.error("Admin session check error:", error);

    return NextResponse.json(
      {
        success: false,
        isAdmin: false,
        error: "管理者セッションの確認に失敗しました。",
      },
      { status: 500 }
    );
  }
}