import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ADMIN_COOKIE_NAME = "gameverse_admin";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstDayRanges() {
  const now = new Date();

  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);

  const todayStartAsJst = Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate()
  );

  const todayStart = new Date(todayStartAsJst - JST_OFFSET_MS);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  return {
    todayStart: todayStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
    yesterdayStart: yesterdayStart.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value === "true";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "管理者のみ確認できます。",
        },
        { status: 403 }
      );
    }

    const {
      todayStart,
      tomorrowStart,
      yesterdayStart,
    } = getJstDayRanges();

    const activeSince = new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();

    const [
      totalResult,
      todayResult,
      yesterdayResult,
      activeResult,
    ] = await Promise.all([
      supabase
        .from("site_visits")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_admin", false),

      supabase
        .from("site_visits")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_admin", false)
        .gte("first_visited_at", todayStart)
        .lt("first_visited_at", tomorrowStart),

      supabase
        .from("site_visits")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_admin", false)
        .gte("first_visited_at", yesterdayStart)
        .lt("first_visited_at", todayStart),

      supabase
        .from("site_visits")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_admin", false)
        .gte("last_visited_at", activeSince),
    ]);

    const error =
      totalResult.error ||
      todayResult.error ||
      yesterdayResult.error ||
      activeResult.error;

    if (error) {
      console.error("Visit stats error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "アクセス数の取得に失敗しました。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        total: totalResult.count ?? 0,
        today: todayResult.count ?? 0,
        yesterday: yesterdayResult.count ?? 0,
        active: activeResult.count ?? 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Visit stats API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "アクセス数の取得中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}