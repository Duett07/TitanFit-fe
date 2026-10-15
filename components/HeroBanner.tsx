"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function HeroBanner() {
  return (
    <>
      {/* Hero Section — Wireframe exact boxed layout */}
      <section style={{ padding: "32px 0 20px" }}>
        <div className="container">
          <div
            style={{
              backgroundColor: "var(--card-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
              {/* Hero Text */}
              <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
                <div style={{ marginBottom: "14px" }}>
                  <span className="badge badge-default">
                    Dinh Dưỡng Thể Hình &amp; Đồ Tập Chính Hãng
                  </span>
                </div>

                <h1
                  className="font-heading"
                  style={{
                    fontSize: "40px",
                    lineHeight: "1.15",
                    marginBottom: "14px",
                    fontWeight: 800,
                  }}
                >
                  Bứt Phá Giới Hạn Cùng{" "}
                  <span style={{ color: "var(--primary)" }}>TITANFIT</span>
                </h1>

                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "15px",
                    maxWidth: "480px",
                    marginBottom: "28px",
                    lineHeight: "1.6",
                  }}
                >
                  Hệ thống bán lẻ chuyên sâu các dòng Whey Isolate tinh khiết, Creatine
                  tăng sức mạnh cùng trang phục tập gym co giãn 4 chiều chuyên dụng.
                </p>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link
                    href="/catalog?type=SUPPLEMENTS"
                    className="btn btn-primary btn-lg"
                  >
                    <span>Mua Sắm Ngay</span>
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
                    href="/catalog?type=SPORTS_GEAR"
                    className="btn btn-outline btn-lg"
                  >
                    <span>Xem Đồ Tập Thể Thao</span>
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div
                className="md:col-span-5 relative overflow-hidden min-h-[300px] md:min-h-full"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <Image
                  src="/images/hero-fitness-athlete.jpg"
                  alt="Athletic Training"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover object-center"
                  style={{ opacity: 0.88 }}
                  priority
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, var(--card-surface) 0%, transparent 40%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Editorial Category Showcase — Wireframe exact */}
      <section style={{ padding: "16px 0 32px" }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Card 1 */}
            <Link
              href="/catalog?type=SUPPLEMENTS"
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <div>
                <span className="badge badge-outline" style={{ marginBottom: "8px" }}>
                  Dinh Dưỡng Thể Thao
                </span>
                <h3
                  className="font-heading"
                  style={{ fontSize: "20px", marginBottom: "4px" }}
                >
                  Whey Protein &amp; Creatine
                </h3>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                  Tăng cơ nạc, phục hồi và bứt phá sức mạnh
                </p>
              </div>
              <div
                style={{
                  color: "var(--muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span className="btn btn-outline btn-sm">
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
              href="/catalog?type=SPORTS_GEAR"
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <div>
                <span className="badge badge-outline" style={{ marginBottom: "8px" }}>
                  Trang Phục Phòng Gym
                </span>
                <h3
                  className="font-heading"
                  style={{ fontSize: "20px", marginBottom: "4px" }}
                >
                  Đồ Tập &amp; Phụ Kiện
                </h3>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                  Thoáng khí, thấm hút mồ hôi và đai bảo hộ
                </p>
              </div>
              <div
                style={{
                  color: "var(--muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span className="btn btn-outline btn-sm">
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
