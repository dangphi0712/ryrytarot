import type { NextRequest } from "next/server";
import { getAdminDb } from "./supabase-admin";

// Kiểm tra request có access token hợp lệ của một admin (email nằm trong ADMIN_EMAILS)
export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const { data, error } = await getAdminDb().auth.getUser(token);
  if (error || !data.user?.email) return false;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(data.user.email.toLowerCase());
}
