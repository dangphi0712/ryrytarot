"use client";

import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, LinearProgress, MenuItem, TextField } from "@mui/material";
import { BOOKING_STATUSES, STATUS_LABELS, type BookingStatus } from "@/lib/constants";
import { vnTime } from "@/lib/time";

type Row = {
  id: string;
  status: BookingStatus;
  customer_name: string;
  phone: string;
  email: string | null;
  note: string | null;
  meet_link: string | null;
  service_options: { name: string; price_vnd: number } | null;
  availability: { start_at: string } | null;
};

export default function BookingManager({ token }: { token: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function load() {
    const res = await fetch("/api/admin/bookings", { headers });
    const json = await res.json();
    if (res.ok) setRows(json);
    else setError(json.error);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(id: string, patch: { status?: BookingStatus; meetLink?: string }) {
    setSaving(true);
    try {
      await saveBooking(id, patch);
    } finally {
      setSaving(false);
    }
  }

  async function saveBooking(id: string, patch: { status?: BookingStatus; meetLink?: string }) {
    setError("");
    setNotice("");
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, ...patch }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    if (json.emailSent) setNotice("Đã lưu link và gửi email cho khách.");
    if (json.emailError) setError(`Đã lưu link nhưng chưa gửi được email: ${json.emailError}`);
    load();
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CircularProgress />
      </div>
    );
  }
  if (rows.length === 0) return <p className="text-secondary">Chưa có lịch hẹn nào.</p>;

  return (
    <div className="d-flex flex-column gap-3">
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice("")}>{notice}</Alert>}
      {saving && <LinearProgress />}
      {rows.map((r) => (
        <BookingCard key={r.id} row={r} onUpdate={update} />
      ))}
    </div>
  );
}

function BookingCard({
  row,
  onUpdate,
}: {
  row: Row;
  onUpdate: (id: string, patch: { status?: BookingStatus; meetLink?: string }) => void;
}) {
  const [meetLink, setMeetLink] = useState(row.meet_link ?? "");
  const start = row.availability?.start_at;
  const when = start ? new Date(start).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) + " " + vnTime(start) : "";

  return (
    <div className="tarot-card p-3">
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
        <div>
          <div className="fw-semibold">{row.customer_name} · {row.phone}</div>
          <div className="small text-secondary">
            {row.service_options?.name} · {when}
          </div>
          {row.email && <div className="small text-secondary">{row.email}</div>}
          {row.note && <div className="small mt-1">Ghi chú: {row.note}</div>}
        </div>
        <div style={{ minWidth: 180 }}>
          <TextField
            select
            size="small"
            label="Trạng thái"
            value={row.status}
            onChange={(e) => onUpdate(row.id, { status: e.target.value as BookingStatus })}
            fullWidth
          >
            {BOOKING_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
            ))}
          </TextField>
        </div>
      </div>
      <div className="d-flex gap-2 align-items-center">
        <TextField
          size="small"
          label="Link Google Meet"
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={() => onUpdate(row.id, { meetLink })}>Lưu</Button>
      </div>
    </div>
  );
}
