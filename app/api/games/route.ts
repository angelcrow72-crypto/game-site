import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("games")
    .select(`
      id,
      title,
      creator,
      genre,
      recommended_age,
      recommended_environment,
      description,
      play_time,
      endings_count,
      controls,
      streaming_policy,
      thumbnail_url,
      thumbnail_urls,
      download_url,
      browser_play_url,
      created_at
    `)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}