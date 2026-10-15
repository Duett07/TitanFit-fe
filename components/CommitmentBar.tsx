import React from "react";

export default function CommitmentBar() {
  return (
    <section
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "36px 0",
        backgroundColor: "var(--card-surface)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {/* 1. 100% Chính Hãng */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ color: "var(--primary)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: "var(--foreground)",
                }}
              >
                100% Chính Hãng
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                  marginTop: "2px",
                }}
              >
                Nhập khẩu tem phụ rõ ràng
              </div>
            </div>
          </div>

          {/* 2. Giao Nhanh 2h */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ color: "var(--primary)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: "var(--foreground)",
                }}
              >
                Giao Nhanh 2h
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                  marginTop: "2px",
                }}
              >
                Miễn phí đơn từ 500.000₫
              </div>
            </div>
          </div>

          {/* 3. Đổi Trả Trong 7 Ngày */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ color: "var(--primary)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: "var(--foreground)",
                }}
              >
                Đổi Trả Trong 7 Ngày
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                  marginTop: "2px",
                }}
              >
                Đổi size miễn phí tiện lợi
              </div>
            </div>
          </div>

          {/* 4. Tư Vấn Dinh Dưỡng Free */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ color: "var(--primary)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: "var(--foreground)",
                }}
              >
                Tư Vấn Dinh Dưỡng Free
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                  marginTop: "2px",
                }}
              >
                Đội ngũ HLV &amp; Chuyên gia 1-1
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
