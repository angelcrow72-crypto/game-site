import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ALLOWED_REASONS = [
  "R18作品",
  "ウイルスの疑い",
  "著作権侵害",
  "ゲームとして成立していない",
  "その他",
];

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const reason = String(body?.reason ?? "").trim();
    const detail = String(body?.detail ?? "").trim();

    if (!ALLOWED_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "通報理由が不正です" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("game_reports").insert({
      game_id: Number(id),
      reason,
      detail,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "通報エラー" },
      { status: 500 }
    );
  }
}