import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

const DECK_COLUMNS = "id, name, summary, description, is_active, sort_order";

// Kiểm tra và chuẩn hóa dữ liệu bộ bài. partial = true khi cập nhật (chỉ xử lý field được gửi lên)
function parseDeck(body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};
  const errors: string[] = [];

  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 80) errors.push("Tên bộ bài từ 2 đến 80 ký tự.");
    out.name = name;
  }
  if (!partial || body.summary !== undefined) {
    const summary = String(body.summary ?? "").trim();
    if (summary.length > 300) errors.push("Mô tả ngắn tối đa 300 ký tự.");
    out.summary = summary || null;
  }
  if (!partial || body.description !== undefined) {
    const description = String(body.description ?? "").trim();
    if (description.length > 5000) errors.push("Ý nghĩa tối đa 5000 ký tự.");
    out.description = description || null;
  }
  if (!partial || body.is_active !== undefined) out.is_active = Boolean(body.is_active);
  if (!partial || body.sort_order !== undefined) {
    const order = Number(body.sort_order ?? 0);
    out.sort_order = Number.isFinite(order) ? Math.trunc(order) : 0;
  }

  return { out, errors };
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const { data, error } = await getAdminDb()
    .from("tarot_decks")
    .select(DECK_COLUMNS)
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const { out, errors } = parseDeck(body, false);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 422 });

  const { data, error } = await getAdminDb().from("tarot_decks").insert(out).select(DECK_COLUMNS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const { out, errors } = parseDeck(body, true);
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 422 });

  const { data, error } = await getAdminDb()
    .from("tarot_decks")
    .update(out)
    .eq("id", id)
    .select(DECK_COLUMNS)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const { error } = await getAdminDb().from("tarot_decks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
