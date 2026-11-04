"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import BookingForm from "@/components/BookingForm";

type BookingContextValue = { openBooking: () => void };

const BookingContext = createContext<BookingContextValue>({ openBooking: () => {} });

// Cung cấp hàm mở popup đặt lịch cho mọi nút trên trang
export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <BookingContext.Provider value={{ openBooking: () => setOpen(true) }}>
      {children}
      <BookingForm open={open} onClose={() => setOpen(false)} />
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
