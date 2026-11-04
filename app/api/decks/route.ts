import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";

// Danh sách bộ bài đang bật, dành cho khách xem
export async function GET() {
  const { data, error } = await getAdminDb()
    .from("tarot_decks")
    .select("id, name, summary, description")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
