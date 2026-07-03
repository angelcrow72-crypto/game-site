import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const threadId = Number(id);

  if (!threadId) {
    return NextResponse.json({ error: "Invalid thread id" }, { status: 400 });
  }

  const { error: postsError } = await supabase
    .from("posts")
    .delete()
    .eq("thread_id", threadId);

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  const { error: threadError } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId);

  if (threadError) {
    return NextResponse.json({ error: threadError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}