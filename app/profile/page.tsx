import { Suspense } from "react";
import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Hồ Sơ Cá Nhân & Thiết Lập Tài Khoản | TITANFIT Sports",
  description:
    "Quản lý thông tin tài khoản cá nhân, sổ địa chỉ nhận hàng, bảo mật mật khẩu và theo dõi thứ hạng thành viên tại TITANFIT.",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            Đang tải thông tin hồ sơ tài khoản...
          </p>
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
