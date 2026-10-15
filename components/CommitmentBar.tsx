import React from "react";

export default function CommitmentBar() {
  return (
    <section className="border-t border-border py-9 bg-card">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Giao Hàng Nhanh 24h */}
          <div className="flex gap-3 items-start">
            <div className="text-primary shrink-0">
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
              <div className="font-semibold text-sm text-foreground">
                Giao Hàng Nhanh 24h
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Miễn phí đơn từ 500.000₫
              </div>
            </div>
          </div>

          {/* 2. 100% Chính Hãng */}
          <div className="flex gap-3 items-start">
            <div className="text-primary shrink-0">
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
              <div className="font-semibold text-sm text-foreground">
                100% Chính Hãng
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Nhập khẩu tem phụ rõ ràng
              </div>
            </div>
          </div>

          {/* 3. Đổi Trả Trong 7 Ngày */}
          <div className="flex gap-3 items-start">
            <div className="text-primary shrink-0">
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
              <div className="font-semibold text-sm text-foreground">
                Đổi Trả Trong 7 Ngày
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Đổi size miễn phí tiện lợi
              </div>
            </div>
          </div>

          {/* 4. VietQR Tự Động Khớp Lệnh */}
          <div className="flex gap-3 items-start">
            <div className="text-primary shrink-0">
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
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">
                VietQR Tự Động Khớp Lệnh
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Quét mã chuyển khoản chuẩn xác
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
