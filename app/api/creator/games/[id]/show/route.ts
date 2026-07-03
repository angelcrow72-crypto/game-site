import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const { data, error: fetchError } = await supabase
      .from("games")
      .select("delete_reason")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (data?.delete_reason === "admin") {
      return NextResponse.json(
        { error: "管理者により非公開化された作品は再公開できません" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("games")
      .update({
        deleted: false,
        delete_reason: null,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "再公開エラー" },
      { status: 500 }
    );
  }
}