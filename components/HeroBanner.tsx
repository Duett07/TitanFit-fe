"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function HeroBanner() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-6 sm:py-8">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden relative shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
              {/* Hero Text */}
              <div className="md:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12">
                <div className="mb-3.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border">
                    Dinh Dưỡng Thể Hình &amp; Đồ Tập Chính Hãng
                  </span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground leading-[1.15] mb-3.5 tracking-tight">
                  Hiệu Suất Tối Đa.
                  <br />
                  Thể Hình Đỉnh Cao.
                </h1>

                <p className="text-muted-foreground text-sm sm:text-base max-w-[480px] mb-7 leading-relaxed">
                  Hệ thống bán lẻ chuyên sâu các dòng Whey Isolate tinh khiết, Creatine tăng sức
                  mạnh cùng trang phục tập gym co giãn 4 chiều chuyên dụng.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products?category=supplements"
                    className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm inline-flex items-center gap-2 shadow-md active:scale-98 transition-all"
                  >
                    <span>Xem Thực Phẩm Bổ Sung</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/products?category=apparel"
                    className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-bold text-sm inline-flex items-center transition-all"
                  >
                    <span>Xem Đồ Tập Thể Thao</span>
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div className="md:col-span-5 relative overflow-hidden min-h-[280px] md:min-h-full bg-secondary">
                <Image
                  src="/images/hero-fitness-athlete.jpg"
                  alt="Athletic Training"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover object-center opacity-85"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-card via-card/40 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Category Showcase */}
      <section className="py-4 pb-8 sm:pb-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Card 1 */}
            <Link
              href="/products?category=supplements"
              className="bg-card border border-border rounded-xl p-6 flex justify-between items-center group hover:border-primary shadow-xs transition-all no-underline"
            >
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground mb-2">
                  Dinh Dưỡng Thể Thao
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Whey Protein &amp; Creatine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tăng cơ nạc, phục hồi và bứt phá sức mạnh
                </p>
              </div>
              <div className="text-muted-foreground flex items-center shrink-0 ml-4">
                <span className="h-8 px-3 rounded-lg border border-border bg-card group-hover:bg-secondary text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                  <span>Khám phá</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Category Card 2 */}
            <Link
              href="/products?category=apparel"
              className="bg-card border border-border rounded-xl p-6 flex justify-between items-center group hover:border-primary shadow-xs transition-all no-underline"
            >
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border text-muted-foreground mb-2">
                  Trang Phục Phòng Gym
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Đồ Tập &amp; Phụ Kiện
                </h3>
                <p className="text-xs text-muted-foreground">
                  Thoáng khí, thấm hút mồ hôi và đai bảo hộ
                </p>
              </div>
              <div className="text-muted-foreground flex items-center shrink-0 ml-4">
                <span className="h-8 px-3 rounded-lg border border-border bg-card group-hover:bg-secondary text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                  <span>Khám phá</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
