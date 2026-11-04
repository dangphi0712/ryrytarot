import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { BOOKING_STATUSES } from "@/lib/constants";
import { sendMeetLinkEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const { data, error } = await getAdminDb()
    .from("bookings")
    .select("id, status, customer_name, phone, email, note, meet_link, created_at, service_options(name, price_vnd), availability(start_at)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Cập nhật trạng thái và/hoặc link Google Meet. Khi link mới được lưu, gửi email cho khách.
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const update: Record<string, string | null> = {};
  if (body.status !== undefined) {
    if (!(BOOKING_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.meetLink !== undefined) {
    const link = String(body.meetLink ?? "").trim();
    if (link && !/^https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(link)) {
      return NextResponse.json({ error: "Link phải có dạng https://meet.google.com/..." }, { status: 400 });
    }
    update.meet_link = link || null;
  }

  const db = getAdminDb();
  const { data: before } = await db.from("bookings").select("meet_link").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Không tìm thấy lịch hẹn" }, { status: 404 });

  const { data, error } = await db
    .from("bookings")
    .update(update)
    .eq("id", id)
    .select("id, status, meet_link, customer_name, email, availability(start_at), service_options(name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Chỉ gửi email khi link thay đổi, tránh gửi lặp mỗi lần lưu
  let emailSent = false;
  let emailError: string | undefined;
  if (data.meet_link && data.meet_link !== before.meet_link) {
    try {
      await sendMeetLinkEmail({
        to: data.email,
        customerName: data.customer_name,
        serviceName: (data.service_options as unknown as { name: string } | null)?.name ?? "Xem Tarot",
        startAt: (data.availability as unknown as { start_at: string } | null)?.start_at ?? new Date().toISOString(),
        meetLink: data.meet_link,
      });
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Lỗi gửi email";
    }
  }

  return NextResponse.json({ ...data, emailSent, emailError });
}
