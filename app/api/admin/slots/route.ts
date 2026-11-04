import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { isValidDateKey, isValidTime, vnDayRange, vnTime, vnToIso } from "@/lib/time";

const ALLOWED_STEPS = [30, 60, 90, 120];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Danh sách khung giờ của một ngày (kèm trạng thái đã đặt hay chưa)
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDateKey(date)) return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });

  const { start, end } = vnDayRange(date);
  const { data, error } = await getAdminDb()
    .from("availability")
    .select("id, start_at, end_at, bookings(id, status, customer_name)")
    .gte("start_at", start)
    .lt("start_at", end)
    .order("start_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const slots = (data ?? []).map((slot) => {
    const bookings = (slot.bookings ?? []) as { id: string; status: string; customer_name: string }[];
    const active = bookings.find((b) => (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(b.status));
    return {
      id: slot.id,
      time: vnTime(slot.start_at),
      endTime: vnTime(slot.end_at),
      booked: Boolean(active),
      customerName: active?.customer_name ?? null,
    };
  });

  return NextResponse.json({ date, slots });
}

// Tạo lịch trống: từ startTime đến endTime, chia theo stepMinutes
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const date = String(body?.date ?? "");
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");
  const stepMinutes = Number(body?.stepMinutes);

  if (!isValidDateKey(date)) return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return NextResponse.json({ error: "Giờ phải theo định dạng HH:MM" }, { status: 400 });
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return NextResponse.json({ error: "Giờ kết thúc phải sau giờ bắt đầu" }, { status: 400 });
  }
  if (!ALLOWED_STEPS.includes(stepMinutes)) {
    return NextResponse.json({ error: "Thời lượng mỗi buổi không hợp lệ" }, { status: 400 });
  }

  const rows: { start_at: string; end_at: string }[] = [];
  for (let t = toMinutes(startTime); t + stepMinutes <= toMinutes(endTime); t += stepMinutes) {
    rows.push({
      start_at: vnToIso(date, fromMinutes(t)),
      end_at: vnToIso(date, fromMinutes(t + stepMinutes)),
    });
  }
  if (rows.length === 0) return NextResponse.json({ error: "Không đủ thời gian cho một buổi" }, { status: 400 });

  // ignoreDuplicates: khung giờ đã tồn tại sẽ được bỏ qua, không ghi đè lịch đã đặt
  const { data, error } = await getAdminDb()
    .from("availability")
    .upsert(rows, { onConflict: "start_at", ignoreDuplicates: true })
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: data?.length ?? 0, requested: rows.length }, { status: 201 });
}

// Xóa một khung giờ trống (không xóa được nếu đang có lịch hẹn)
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const db = getAdminDb();
  const { count } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", id)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);
  if (count && count > 0) {
    return NextResponse.json({ error: "Khung giờ đang có lịch hẹn, không thể xóa." }, { status: 409 });
  }

  const { error } = await db.from("availability").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
