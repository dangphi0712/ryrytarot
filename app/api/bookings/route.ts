import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const optionId = String(body.optionId ?? "");
  const slotId = String(body.slotId ?? "");
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").replace(/\s+/g, "");
  const email = String(body.email ?? "").trim();
  const note = String(body.note ?? "").trim();

  const errors: string[] = [];
  if (!optionId) errors.push("Vui lòng chọn gói dịch vụ.");
  if (!slotId) errors.push("Vui lòng chọn giờ.");
  if (name.length < 2 || name.length > 80) errors.push("Họ tên từ 2 đến 80 ký tự.");
  if (!/^(0|\+84)\d{9}$/.test(phone)) errors.push("Số điện thoại không hợp lệ.");
  if (!EMAIL_RE.test(email)) errors.push("Email là bắt buộc và phải hợp lệ.");
  if (note.length > 500) errors.push("Ghi chú tối đa 500 ký tự.");
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 422 });

  const db = getAdminDb();

  const { data: option } = await db
    .from("service_options")
    .select("id, service_id")
    .eq("id", optionId)
    .eq("is_active", true)
    .maybeSingle();
  if (!option) return NextResponse.json({ error: "Gói dịch vụ không tồn tại." }, { status: 422 });

  const { data: slot } = await db
    .from("availability")
    .select("id, start_at")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot || Date.parse(slot.start_at) <= Date.now()) {
    return NextResponse.json({ error: "Khung giờ không hợp lệ hoặc đã qua." }, { status: 422 });
  }

  // Unique index bookings_one_active_per_slot đảm bảo không đặt trùng, kể cả khi 2 request đến cùng lúc
  const { data, error } = await db
    .from("bookings")
    .insert({
      slot_id: slotId,
      service_id: option.service_id,
      option_id: option.id,
      customer_name: name,
      phone,
      email,
      note: note || null,
      status: "pending",
    })
    .select("id, status, meet_link, customer_name, email")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Khung giờ vừa có người đặt, vui lòng chọn giờ khác." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
