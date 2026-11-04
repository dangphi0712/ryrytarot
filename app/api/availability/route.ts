import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { isValidDateKey, vnDayRange, vnTime } from "@/lib/time";

// Trả về các khung giờ còn trống trong một ngày (chỉ khung giờ tương lai, chưa có lịch đang hoạt động)
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDateKey(date)) {
    return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  }

  const { start, end } = vnDayRange(date);
  const { data, error } = await getAdminDb()
    .from("availability")
    .select("id, start_at, bookings(status)")
    .gte("start_at", start)
    .lt("start_at", end)
    .gt("start_at", new Date().toISOString())
    .order("start_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const slots = (data ?? [])
    .filter((slot) => {
      const bookings = (slot.bookings ?? []) as { status: string }[];
      return !bookings.some((b) => (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(b.status));
    })
    .map((slot) => ({ id: slot.id, time: vnTime(slot.start_at) }));

  return NextResponse.json({ date, slots });
}
