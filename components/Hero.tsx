"use client";

import type { CSSProperties } from "react";
import { Button } from "@mui/material";
import styles from "./Hero.module.css";
import { useBooking } from "@/components/BookingContext";

// Vị trí sao cố định (không dùng Math.random) để server và client render giống nhau
const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  top: (i * 37) % 100,
  left: (i * 53) % 100,
  size: 1 + (i % 3),
  delay: ((i % 7) * 0.6).toFixed(1),
}));

const CARDS = [
  { x: "-95px", r: "-14deg", d: "-1s", variant: "a" },
  { x: "0px", r: "0deg", d: "0s", variant: "b" },
  { x: "95px", r: "14deg", d: "-2.5s", variant: "c" },
] as const;

function CardBack({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 190" aria-hidden="true">
      <defs>
        <linearGradient id={`card-bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a3370" />
          <stop offset="1" stopColor="#1b1426" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="186" rx="12" fill={`url(#card-bg-${id})`} stroke="#e6c27a" strokeWidth="2" />
      <rect x="10" y="10" width="100" height="170" rx="8" fill="none" stroke="#e6c27a" strokeOpacity="0.45" />
      <circle cx="60" cy="95" r="36" fill="none" stroke="#c9a7ff" strokeWidth="1.2" strokeDasharray="3 4" />
      <circle cx="60" cy="95" r="22" fill="#e6c27a" />
      <circle cx="69" cy="88" r="20" fill="#2a1f40" />
      <circle cx="32" cy="48" r="2" fill="#e6c27a" />
      <circle cx="88" cy="58" r="1.6" fill="#e6c27a" />
      <circle cx="28" cy="140" r="1.6" fill="#e6c27a" />
      <circle cx="92" cy="142" r="2" fill="#e6c27a" />
      <path d="M60 22 L62.5 28 L69 30.5 L62.5 33 L60 39 L57.5 33 L51 30.5 L57.5 28 Z" fill="#e6c27a" />
    </svg>
  );
}

export default function Hero() {
  const { openBooking } = useBooking();

  return (
    <section className={styles.hero}>
      <div className={styles.stars} aria-hidden="true">
        {STARS.map((s) => (
          <span
            key={s.id}
            className={styles.star}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.cards}>
          {CARDS.map((c) => (
            <div
              key={c.variant}
              className={styles.cardWrap}
              style={{ "--x": c.x, "--r": c.r } as CSSProperties}
            >
              <div className={styles.card} style={{ "--d": c.d } as CSSProperties}>
                <CardBack id={c.variant} />
              </div>
            </div>
          ))}
        </div>

        <p className={styles.eyebrow}>✦ Lắng nghe lá bài · Tìm lời đáp ✦</p>
        <h1 className={styles.title}>Đặt lịch xem Tarot</h1>
        <p className={styles.subtitle}>
          Chọn dịch vụ, ngày và giờ phù hợp. Buổi xem diễn ra trực tuyến qua Google Meet.
        </p>
        <Button onClick={openBooking} variant="contained" size="large" className={styles.cta}>
          Đặt lịch ngay
        </Button>
      </div>
    </section>
  );
}
