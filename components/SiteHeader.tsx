"use client";

import { useEffect, useState } from "react";
import { AppBar, Button, Toolbar } from "@mui/material";
import { useBooking } from "@/components/BookingContext";
import styles from "./SiteHeader.module.css";

// Chỉ liệt kê các section có thật trên trang chủ
const NAV_ITEMS = [
  { id: "decks", label: "Bộ bài" },
  { id: "pricing", label: "Bảng giá" },
];

export default function SiteHeader() {
  const { openBooking } = useBooking();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  // Thu nhỏ header và đổi nền khi cuộn xuống
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Đánh dấu mục menu tương ứng với section đang hiển thị
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      className={`${styles.bar} ${scrolled ? styles.scrolled : ""}`}
    >
      <Toolbar className={styles.toolbar} disableGutters>
        <button
          type="button"
          className={styles.brand}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Về đầu trang"
        >
          <span className={styles.star} aria-hidden="true">✦</span>
          <span className={styles.brandText}>ryrytarot</span>
        </button>

        <nav className={styles.nav} aria-label="Điều hướng">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`${styles.navItem} ${active === item.id ? styles.navActive : ""}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Button variant="contained" size="small" onClick={openBooking} className={styles.cta}>
          Đặt lịch
        </Button>
      </Toolbar>
    </AppBar>
  );
}
