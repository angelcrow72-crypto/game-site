import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const ADMIN_DELETE_PASSWORD = process.env.ADMIN_DELETE_PASSWORD || "";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 16: params は Promise
    const { id } = await ctx.params;

    // ヘッダーからパスワード取得
    const pass = req.headers.get("x-admin-pass") || "";

    if (!ADMIN_DELETE_PASSWORD) {
      return NextResponse.json(
        { error: "Server admin password is not configured." },
        { status: 500 }
      );
    }

    if (pass !== ADMIN_DELETE_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: `Invalid id: ${String(id)}` },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}