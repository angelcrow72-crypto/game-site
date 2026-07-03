import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: Request) {
  const adminPass = req.headers.get("x-admin-pass");

  if (adminPass !== process.env.ADMIN_DELETE_PASSWORD) {
    return NextResponse.json(
      { error: "管理者パスワードが違います" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("game_reports")
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const summary: Record<number, any> = {};

  for (const report of data ?? []) {
    const gameId = report.game_id;

    if (!summary[gameId]) {
      summary[gameId] = {
        game_id: gameId,
        total: 0,
        reasons: {},
      };
    }

    summary[gameId].total++;

    summary[gameId].reasons[report.reason] =
      (summary[gameId].reasons[report.reason] ?? 0) + 1;
  }

  return NextResponse.json(
    Object.values(summary)
  );
}