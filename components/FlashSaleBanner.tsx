"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Flame } from "lucide-react";

export default function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 7,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 11, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <section style={{ padding: "16px 0 24px" }}>
      <div className="container">
        <div
          className="card"
          style={{
            position: "relative",
            overflow: "hidden",
            borderColor: "rgba(249, 115, 22, 0.4)",
            background: "linear-gradient(135deg, var(--card-surface) 0%, var(--secondary) 50%, var(--card-surface) 100%)",
            padding: "32px",
          }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            {/* Left: Headline & Badge */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold mb-3 tracking-wide uppercase">
                <Flame size={14} className="fill-primary" />
                <span>GIỜ VÀNG ƯU ĐÃI THỂ HÌNH</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-2">
                FLASH SALE <span className="text-primary">GIẢM 30%</span> TẤT CẢ WHEY &amp; PRO-COMBAT
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Cơ hội sở hữu thực phẩm bổ sung dinh dưỡng chuẩn quốc tế và trang phục tập gym
                chính hãng với giá ưu đãi tốt nhất trong ngày.
              </p>
            </div>

            {/* Right: Countdown Timer & CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto justify-center">
              {/* Timer Blocks */}
              <div className="flex items-center gap-2 text-center">
                <div className="flex flex-col items-center">
                  <div
                    suppressHydrationWarning
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-background border border-border flex items-center justify-center font-heading text-xl sm:text-2xl font-extrabold text-foreground shadow-md"
                  >
                    {formatNumber(timeLeft.hours)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Giờ
                  </span>
                </div>

                <span className="text-2xl font-bold text-primary -mt-4">:</span>

                <div className="flex flex-col items-center">
                  <div
                    suppressHydrationWarning
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-background border border-border flex items-center justify-center font-heading text-xl sm:text-2xl font-extrabold text-primary shadow-md"
                  >
                    {formatNumber(timeLeft.minutes)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Phút
                  </span>
                </div>

                <span className="text-2xl font-bold text-primary -mt-4">:</span>

                <div className="flex flex-col items-center">
                  <div
                    suppressHydrationWarning
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-background border border-border flex items-center justify-center font-heading text-xl sm:text-2xl font-extrabold text-foreground shadow-md"
                  >
                    {formatNumber(timeLeft.seconds)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                    Giây
                  </span>
                </div>
              </div>

              {/* Action Button & Stock urgency */}
              <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
                <Link
                  href="/flash-sale"
                  className="btn btn-primary h-12 px-6 text-sm font-bold shadow-lg shadow-primary/30 w-full sm:w-auto flex items-center justify-center gap-2 group"
                >
                  <Zap size={16} className="fill-white" />
                  <span>Săn Deal Ngay</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="w-full flex items-center gap-2">
                  <div className="w-full sm:w-36 h-2 bg-secondary rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-gradient-to-r from-primary to-amber-500 w-[84%] rounded-full animate-pulse" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 whitespace-nowrap">
                    Đã bán 84%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
