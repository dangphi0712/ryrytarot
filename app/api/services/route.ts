import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";

// Trả về các dịch vụ đang bật, mỗi dịch vụ kèm danh sách gói giá đang bật
export async function GET() {
  const { data, error } = await getAdminDb()
    .from("services")
    .select(
      "id, name, description, is_active, service_options(id, name, description, price_vnd, sort_order, is_active)"
    )
    .eq("is_active", true)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const services = (data ?? []).map((s) => {
    const options = ((s.service_options ?? []) as {
      id: string;
      name: string;
      description: string | null;
      price_vnd: number;
      sort_order: number;
      is_active: boolean;
    }[])
      .filter((o) => o.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, name, description, price_vnd }) => ({ id, name, description, price_vnd }));

    return { id: s.id, name: s.name, description: s.description, options };
  });

  return NextResponse.json(services);
}
