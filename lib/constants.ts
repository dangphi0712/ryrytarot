// Trạng thái lịch hẹn đang "chiếm" khung giờ
export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "done"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  done: "Hoàn thành",
};
