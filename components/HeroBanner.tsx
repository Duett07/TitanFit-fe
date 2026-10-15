"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingCart,
  Dumbbell,
  ShieldCheck,
  Zap,
  Star,
  Award,
  Truck,
  RotateCcw,
} from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-card-surface via-background to-background border-b border-border">
      {/* Background ambient lighting glows */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Cột Trái: Typography, Slogan, CTA và Tín nhiệm */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-primary mb-6 shadow-sm hover:border-primary/40 transition-colors">
              <Zap size={14} className="text-primary fill-primary animate-pulse" />
              <span>TITAN PRO ATHLETE 2026 — ĐỈNH CAO NĂNG LƯỢNG</span>
            </div>

            {/* Slogan Chính */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-6">
              Bứt Phá Giới Hạn Cùng{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-500">
                TITANFIT
              </span>
            </h1>

            {/* Đoạn mô tả thương hiệu */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed font-sans">
              Trang phục thể thao hiệu năng cao chống mồ hôi &amp; thực phẩm bổ sung
              dinh dưỡng thể hình nhập khẩu chính ngạch 100%. Đồng hành cùng các vận
              động viên và gymer chinh phục mọi mục tiêu thể hình đỉnh cao.
            </p>

            {/* Nút Kêu Gọi Hành Động (CTA) */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
              <Link
                href="/do-the-thao"
                className="btn btn-primary h-13 px-8 text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto group"
              >
                <ShoppingCart size={18} className="group-hover:rotate-6 transition-transform" />
                <span>Mua Sắm Ngay</span>
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dinh-duong"
                className="btn btn-secondary h-13 px-7 text-sm font-semibold hover:border-foreground/30 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Dumbbell size={17} className="text-primary" />
                <span>Khám Phá Dinh Dưỡng</span>
              </Link>
            </div>

            {/* Social Proof & Đánh giá */}
            <div className="pt-6 border-t border-border/80 w-full flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="text-amber-400 fill-amber-400"
                  />
                ))}
                <span className="font-heading font-bold text-sm text-foreground ml-1">
                  4.9/5
                </span>
              </div>
              <div className="hidden sm:block text-border text-xs">|</div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Award size={16} className="text-primary" />
                <span>
                  Hơn <strong className="text-foreground font-semibold">50.000+</strong> vận
                  động viên &amp; Gymer toàn quốc tin dùng
                </span>
              </div>
            </div>
          </div>

          {/* Cột Phải: Hình ảnh thể hình cơ bắp & Thẻ thông số nổi */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Vòng sáng nền tạo chiều sâu cho ảnh */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-orange-500/10 rounded-2xl filter blur-2xl transform scale-95" />

            {/* Khung chứa ảnh thể hình */}
            <div className="relative w-full max-w-[460px] aspect-[4/3] rounded-2xl overflow-hidden border border-border/90 shadow-2xl bg-card-surface group">
              <Image
                src="/images/hero-fitness-athlete.jpg"
                alt="Vận động viên thể hình cơ bắp đỉnh cao TITANFIT"
                fill
                sizes="(max-width: 768px) 100vw, 460px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />

              {/* Lớp phủ dải màu bóng tối nhẹ phía dưới */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Huy hiệu thành tích góc dưới ảnh */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-zinc-200 backdrop-blur-md bg-black/40 px-3.5 py-2 rounded-xl border border-white/10">
                <span className="font-heading font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  TITAN ATHLETE ELITE
                </span>
                <span className="text-zinc-300 text-[11px]">Thi Đấu Đỉnh Cao</span>
              </div>
            </div>

            {/* Thẻ nổi 1: 100% Chính Hãng (Góc trên bên trái) */}
            <div className="absolute -top-4 -left-4 sm:-top-5 sm:-left-6 bg-card-surface/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl hidden sm:flex items-center gap-3 animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Kiểm định an toàn
                </p>
                <p className="text-xs font-bold text-foreground font-heading">
                  100% Thể Thao Chính Hãng
                </p>
              </div>
            </div>

            {/* Thẻ nổi 2: Tăng trưởng & Năng lượng (Góc dưới bên phải) */}
            <div className="absolute -bottom-5 -right-3 sm:-bottom-6 sm:-right-5 bg-card-surface/95 backdrop-blur-md border border-border p-3.5 rounded-xl shadow-xl hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Dumbbell size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Dinh dưỡng Whey &amp; Quần áo
                </p>
                <p className="text-xs font-bold text-foreground font-heading">
                  Tăng Sức Bền • Phát Triển Cơ Bắp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Thẻ Lợi Ích Dịch Vụ Cốt Lõi (Value Proposition Strip) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 pt-10 border-t border-border/80">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card-surface border border-border hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-heading">
                100% Chính Hãng Nhập Khẩu
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Tem kiểm định thể thao minh bạch, xuất xứ rõ ràng từ các nhà máy &amp;
                thương hiệu thể hình hàng đầu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card-surface border border-border hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-heading">
                Giao Hỏa Tốc 2 Giờ
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Đóng gói chuyên nghiệp, giao nhanh nội thành Hà Nội &amp; TP.HCM, hỗ trợ
                đồng kiểm trước khi thanh toán.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-card-surface border border-border hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-heading">
                Đổi Trả 30 Ngày &amp; Bảo Hành
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Đổi size tận nơi hoàn toàn miễn phí, bảo hành đường chỉ đồ tập trọn đời,
                an tâm tập luyện bứt phá.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
