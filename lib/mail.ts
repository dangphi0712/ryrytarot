import nodemailer from "nodemailer";
import { vnTime } from "@/lib/time";

export type MeetLinkEmail = {
  to: string;
  customerName: string;
  serviceName: string;
  startAt: string;
  meetLink: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

// Gửi email chứa link Google Meet cho khách qua SMTP (ví dụ Gmail với App Password)
export async function sendMeetLinkEmail(input: MeetLinkEmail) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("Chưa cấu hình SMTP_HOST, SMTP_USER hoặc SMTP_PASS");

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const date = new Date(input.startAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const when = `${date} lúc ${vnTime(input.startAt)}`;
  const name = escapeHtml(input.customerName);
  const service = escapeHtml(input.serviceName);
  const link = escapeHtml(input.meetLink);

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: input.to,
    subject: `Link Google Meet – ${input.serviceName} (${when})`,
    text: [
      `Xin chào ${input.customerName},`,
      "",
      "Lịch xem Tarot của bạn đã được xác nhận.",
      `Dịch vụ: ${input.serviceName}`,
      `Thời gian: ${when}`,
      `Link Google Meet: ${input.meetLink}`,
      "",
      "Vui lòng vào đúng giờ. Cảm ơn bạn!",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2a2137">
        <h2 style="color:#7e4fd6;margin-bottom:8px">Lịch xem Tarot của bạn</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Lịch của bạn đã được xác nhận:</p>
        <ul style="line-height:1.8">
          <li>Dịch vụ: <strong>${service}</strong></li>
          <li>Thời gian: <strong>${when}</strong></li>
        </ul>
        <p style="margin:24px 0">
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#7e4fd6;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold">
            Vào Google Meet
          </a>
        </p>
        <p style="font-size:13px;color:#6d5f80">Link trực tiếp: ${link}</p>
        <p style="font-size:13px;color:#6d5f80">Vui lòng vào đúng giờ. Cảm ơn bạn!</p>
      </div>`,
  });
}
