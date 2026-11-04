"use client";

import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, MenuItem, TextField } from "@mui/material";
import { vnToday } from "@/lib/time";

type Slot = { id: string; time: string; endTime: string; booked: boolean; customerName: string | null };

export default function SlotManager({ token }: { token: string }) {
  const [date, setDate] = useState(vnToday());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [step, setStep] = useState(60);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function loadSlots(d: string) {
    setLoadingSlots(true);
    try {
      await fetchSlots(d);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function fetchSlots(d: string) {
    const res = await fetch(`/api/admin/slots?date=${d}`, { headers });
    const json = await res.json();
    if (res.ok) setSlots(json.slots);
    else setMessage({ type: "error", text: json.error });
  }

  useEffect(() => {
    loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function createSlots() {
    setCreating(true);
    try {
      await submitSlots();
    } finally {
      setCreating(false);
    }
  }

  async function submitSlots() {
    setMessage(null);
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers,
      body: JSON.stringify({ date, startTime, endTime, stepMinutes: step }),
    });
    const json = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: json.error });
    setMessage({
      type: "success",
      text: `Đã tạo ${json.created} khung giờ mới (${json.requested - json.created} khung đã tồn tại được bỏ qua).`,
    });
    loadSlots(date);
  }

  async function deleteSlot(id: string) {
    setMessage(null);
    const res = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE", headers });
    const json = await res.json();
    if (!res.ok) return setMessage({ type: "error", text: json.error });
    loadSlots(date);
  }

  return (
    <div className="d-flex flex-column gap-3">
      <section className="tarot-card p-3">
        <h2 className="h6 mb-3">Thiết lập lịch trống</h2>
        <div className="row g-3">
          <div className="col-12 col-md-3">
            <TextField type="date" label="Ngày" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          </div>
          <div className="col-6 col-md-2">
            <TextField type="time" label="Từ giờ" value={startTime} onChange={(e) => setStartTime(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          </div>
          <div className="col-6 col-md-2">
            <TextField type="time" label="Đến giờ" value={endTime} onChange={(e) => setEndTime(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
          </div>
          <div className="col-12 col-md-3">
            <TextField select label="Mỗi buổi" value={step} onChange={(e) => setStep(Number(e.target.value))} fullWidth>
              {[30, 60, 90, 120].map((m) => (
                <MenuItem key={m} value={m}>{m} phút</MenuItem>
              ))}
            </TextField>
          </div>
          <div className="col-12 col-md-2 d-grid">
            <Button
              variant="contained"
              onClick={createSlots}
              disabled={creating}
              sx={{ height: "100%" }}
              startIcon={creating ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {creating ? "Đang tạo" : "Tạo lịch"}
            </Button>
          </div>
        </div>
        {message && <Alert severity={message.type} className="mt-3">{message.text}</Alert>}
      </section>

      <section className="tarot-card p-3">
        <h2 className="h6 mb-3">Khung giờ ngày {date.split("-").reverse().join("/")}</h2>
        {loadingSlots && (
          <div className="d-flex justify-content-center py-3">
            <CircularProgress />
          </div>
        )}
        {!loadingSlots && slots.length === 0 && <p className="text-secondary mb-0">Chưa có khung giờ nào.</p>}
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2">
          {slots.map((s) => (
            <div className="col" key={s.id}>
              <div className={`p-2 rounded border ${s.booked ? "border-warning" : "border-success-subtle"}`}>
                <div className="fw-semibold">{s.time} – {s.endTime}</div>
                <div className="small text-secondary mb-2">
                  {s.booked ? `Đã đặt: ${s.customerName}` : "Còn trống"}
                </div>
                {!s.booked && (
                  <Button size="small" color="error" variant="outlined" fullWidth onClick={() => deleteSlot(s.id)}>
                    Xóa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
