"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BOOKING_WINDOW_DAYS, formatDateVi, vnAddDays, vnToday } from "@/lib/time";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./BookingForm.module.css";
import calStyles from "./BookingCalendar.module.css";
import steps from "./BookingSteps.module.css";

// Chuyển Date thành chuỗi "YYYY-MM-DD" theo ngày đã chọn trên lịch
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const WEEKDAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

type Option = { id: string; name: string; description: string | null; price_vnd: number };
type Service = { id: string; name: string; description: string | null; options: Option[] };
type Slot = { id: string; time: string };
type Booking = { id: string; status: string; meet_link: string | null; customer_name: string; email: string };
type Form = { name: string; phone: string; email: string; note: string };

const STEPS = ["Gói dịch vụ", "Ngày & giờ", "Thông tin", "Hoàn tất"];
const DONE_STEP = 3;
const EMPTY_FORM: Form = { name: "", phone: "", email: "", note: "" };

const money = (v: number) => v.toLocaleString("vi-VN") + "đ";
const isValidPhone = (phone: string) => /^(0|\+84)\d{9}$/.test(phone.replace(/\s+/g, ""));
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function BookingForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [optionId, setOptionId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotId, setSlotId] = useState("");
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ booking: Booking; time: string } | null>(null);

  const today = vnToday();
  const maxDate = vnAddDays(today, BOOKING_WINDOW_DAYS);
  const selectedOption = service?.options.find((o) => o.id === optionId);
  const selectedSlot = slots.find((s) => s.id === slotId);

  useEffect(() => {
    if (!open || service) return;
    fetch("/api/services")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !Array.isArray(data)) throw new Error(data?.error ?? "Lỗi tải dịch vụ");
        setService(data[0] ?? null);
      })
      .catch((err) => setError(`Không tải được dịch vụ: ${err.message}`))
      .finally(() => setLoadingService(false));
  }, [open, service]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    loadSlots(date);
  }, [date]);

  function loadSlots(d: string) {
    setLoadingSlots(true);
    fetch(`/api/availability?date=${d}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Không tải được lịch trống."))
      .finally(() => setLoadingSlots(false));
  }

  function chooseDate(value: string) {
    setDate(value);
    setSlotId("");
  }

  function reset() {
    setStep(0);
    setOptionId("");
    setDate("");
    setSlots([]);
    setSlotId("");
    setForm(EMPTY_FORM);
    setError("");
    setResult(null);
  }

  function handleClose() {
    if (step === DONE_STEP) reset();
    onClose();
  }

  const canNext = step === 0 ? !!optionId : step === 1 ? !!slotId : true;
  const canSubmit = form.name.trim().length >= 2 && isValidPhone(form.phone) && isValidEmail(form.email) && !submitting;

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, slotId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
        if (res.status === 409) {
          // Khung giờ vừa bị người khác đặt: quay lại bước chọn giờ
          setSlotId("");
          setStep(1);
          loadSlots(date);
        }
        return;
      }
      setResult({ booking: json, time: selectedSlot?.time ?? "" });
      setStep(DONE_STEP);
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      sx={{ "& .MuiDialog-paper": { backgroundImage: "none", border: 1, borderColor: "divider" } }}
    >
      <DialogTitle className="d-flex justify-content-between align-items-center">
        Đặt lịch xem Tarot
        <IconButton onClick={handleClose} aria-label="Đóng">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Mỗi bước là một Fade riêng, key theo step để animation chạy lại khi chuyển bước */}
        <Fade in key={step} timeout={350}>
          <div>
            {step === 0 && (
              <div className="d-flex flex-column gap-3">
                {loadingService && (
                  <div className="d-flex justify-content-center py-4">
                    <CircularProgress />
                  </div>
                )}
                {!loadingService && !service && !error && (
                  <p className="text-secondary mb-0">Hiện chưa có dịch vụ nào đang mở.</p>
                )}
                {service && (
                  <>
                    <div className="text-center">
                      <h3 className={styles.serviceTitle}>✦ {service.name} ✦</h3>
                      {service.description && (
                        <p className="text-secondary small mb-0 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="row g-3">
                      {service.options.map((opt) => {
                        const active = optionId === opt.id;
                        return (
                          <div className="col-12 col-sm-6" key={opt.id}>
                            <button
                              type="button"
                              aria-pressed={active}
                              onClick={() => setOptionId(opt.id)}
                              className={`${styles.option} ${active ? styles.optionActive : ""}`}
                            >
                              <span className={styles.optionCheck}>{active ? "✓" : ""}</span>
                              <span className={styles.optionName}>{opt.name}</span>
                              <span className={styles.optionPrice}>{money(opt.price_vnd)}</span>
                              {opt.description && <span className={styles.optionDesc}>{opt.description}</span>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="d-flex flex-column gap-3">
                <div className={calStyles.wrap}>
                  <Calendar
                    locale="vi-VN"
                    value={date ? parseKey(date) : null}
                    onChange={(value) => {
                      if (value instanceof Date) chooseDate(toKey(value));
                    }}
                    formatShortWeekday={(_, d) => WEEKDAYS_VI[d.getDay()]}
                    prev2Label={null}
                    next2Label={null}
                    tileDisabled={({ date: d, view }) => view === "month" && (toKey(d) < today || toKey(d) > maxDate)}
                  />
                </div>
                <p className={calStyles.slotsTitle}>
                  {date ? `Giờ trống ngày ${formatDateVi(date)}` : "Giờ trống"}
                </p>
                <div className="row row-cols-3 row-cols-sm-4 g-2">
                  {loadingSlots && (
                    <div className="col-12 d-flex justify-content-center py-3">
                      <CircularProgress size={28} />
                    </div>
                  )}
                  {!date && <p className="text-secondary small mb-0">Chọn ngày để xem giờ trống.</p>}
                  {!loadingSlots && date && slots.length === 0 && (
                    <p className="text-secondary small mb-0">Ngày này chưa có giờ trống.</p>
                  )}
                  {!loadingSlots &&
                    slots.map((slot) => (
                      <div className="col" key={slot.id}>
                        <button
                          type="button"
                          aria-pressed={slotId === slot.id}
                          onClick={() => setSlotId(slot.id)}
                          className={`${calStyles.slot} ${slotId === slot.id ? calStyles.slotActive : ""}`}
                        >
                          {slot.time}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="d-flex flex-column gap-3">
                <div className={steps.summary}>
                  <div className={steps.summaryHead}>Tóm tắt lịch hẹn</div>
                  <div className={steps.summaryBody}>
                    <div className={steps.summaryItem}>
                      <span>Gói dịch vụ</span>
                      <strong>{selectedOption?.name}</strong>
                    </div>
                    <div className={steps.summaryItem}>
                      <span>Học phí</span>
                      <strong className={steps.summaryPrice}>{money(selectedOption?.price_vnd ?? 0)}</strong>
                    </div>
                    <div className={steps.summaryItem}>
                      <span>Ngày</span>
                      <strong>{formatDateVi(date)}</strong>
                    </div>
                    <div className={steps.summaryItem}>
                      <span>Giờ</span>
                      <strong>{selectedSlot?.time}</strong>
                    </div>
                  </div>
                </div>
                <TextField
                  label="Họ và tên"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Số điện thoại"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0901234567"
                  error={form.phone.length > 0 && !isValidPhone(form.phone)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={form.email.length > 0 && !isValidEmail(form.email)}
                  helperText="Link Google Meet sẽ được gửi tới email này"
                  fullWidth
                />
                <TextField
                  label="Câu hỏi / ghi chú"
                  multiline
                  minRows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  fullWidth
                />
              </div>
            )}

            {step === DONE_STEP && result && (
              <div className={steps.done}>
                <div className={steps.check}>
                  <svg viewBox="0 0 84 84" aria-hidden="true">
                    <circle className={steps.checkCircle} cx="42" cy="42" r="24" pathLength={151} />
                    <path className={steps.checkMark} d="M31 43 L39 51 L54 34" pathLength={36} />
                  </svg>
                </div>
                <h3 className={steps.doneTitle}>Đặt lịch thành công!</h3>
                <p className={steps.doneText}>
                  Lịch của bạn đang chờ xác nhận. Link Google Meet sẽ được gửi tới <strong>{form.email}</strong> sau khi xác nhận.
                </p>

                <div className={steps.ticket}>
                  <div className={steps.ticketRow}>
                    <span>Gói</span>
                    <strong>{selectedOption?.name}</strong>
                  </div>
                  <div className={steps.ticketRow}>
                    <span>Ngày</span>
                    <strong>{formatDateVi(date)}</strong>
                  </div>
                  <div className={steps.ticketRow}>
                    <span>Giờ</span>
                    <strong>{result.time}</strong>
                  </div>
                  <div className={steps.ticketRow}>
                    <span>Khách</span>
                    <strong>{form.name}</strong>
                  </div>
                </div>

                <p className={steps.hint}>Hãy kiểm tra cả hộp thư spam khi nhận email xác nhận.</p>
              </div>
            )}
          </div>
        </Fade>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      {step !== DONE_STEP && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>
            Quay lại
          </Button>
          <div className="flex-grow-1" />
          {step < 2 ? (
            <Button variant="contained" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={!canSubmit}
              onClick={submit}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
            </Button>
          )}
        </DialogActions>
      )}

      {step === DONE_STEP && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={handleClose}>
            Đóng
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
