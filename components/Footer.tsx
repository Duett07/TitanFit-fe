"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PhoneCall,
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="site-footer">
      <div className="container-custom">
        <div className="footer-grid">
          {/* Cột 1: Thông tin thương hiệu TITANFIT & Giấy phép */}
          <div className="flex flex-col">
            <Link href="/" className="inline-block mb-4">
              <div className="relative h-9 w-44">
                <Image
                  src="/images/titanfit-logo-dark.png"
                  alt="TITANFIT Sports & Nutrition"
                  fill
                  sizes="176px"
                  className="object-contain"
                />
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-muted-foreground mb-4">
              TITANFIT — Thương hiệu trang phục thể thao &amp; thực phẩm bổ sung dinh
              dưỡng thể hình hàng đầu Việt Nam. Thiết kế đột phá, chất liệu đạt
              chuẩn thi đấu quốc tế, đồng hành cùng bạn bứt phá mọi giới hạn thể lực.
            </p>

            <div className="text-xs text-subtle-foreground space-y-1 mb-4">
              <p>
                <strong className="text-foreground">Giấy phép thể thao:</strong>{" "}
                0108998899/GP-SVHTT do Sở Văn Hóa &amp; Thể Thao cấp.
              </p>
              <p>
                <strong className="text-foreground">ĐKKD:</strong> 0108998899 do
                Sở Kế hoạch &amp; Đầu tư Hà Nội cấp ngày 15/01/2020.
              </p>
            </div>

            {/* Chứng nhận thể thao chính hãng */}
            <div className="cert-badge">
              <ShieldCheck size={18} className="text-primary flex-shrink-0" />
              <span>Chứng nhận thể thao &amp; dinh dưỡng chính hãng 100%</span>
            </div>

            {/* Mạng xã hội */}
            <div className="footer-social-row">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="TITANFIT trên Facebook"
                title="Facebook"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="TITANFIT trên Instagram"
                title="Instagram"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="TITANFIT trên YouTube"
                title="YouTube"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="TITANFIT trên TikTok"
                title="TikTok"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Cột 2: Chính sách & Bảo hành */}
          <div>
            <h3 className="footer-col-title">Chính Sách Bảo Hành</h3>
            <ul className="footer-links-list">
              <li>
                <Link href="/chinh-sach-bao-hanh">
                  Chính sách bảo hành chính hãng
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-doi-tra">
                  Đổi trả miễn phí 30 ngày tận nơi
                </Link>
              </li>
              <li>
                <Link href="/huong-dan-chon-size">
                  Hướng dẫn chọn size đồ thể thao
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-kiem-hang">
                  Chính sách kiểm hàng &amp; giao vận
                </Link>
              </li>
              <li>
                <Link href="/huong-dan-bao-quan">
                  Hướng dẫn bảo quản đồ tập &amp; whey
                </Link>
              </li>
              <li>
                <Link href="/tra-cuu-bao-hanh">
                  Tra cứu tiến độ bảo hành điện tử
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Danh mục thể thao */}
          <div>
            <h3 className="footer-col-title">Danh Mục Sản Phẩm</h3>
            <ul className="footer-links-list">
              <li>
                <Link href="/do-the-thao-nam">Đồ thể thao &amp; Gym nam</Link>
              </li>
              <li>
                <Link href="/do-the-thao-nu">Quần áo &amp; Set tập gym nữ</Link>
              </li>
              <li>
                <Link href="/whey-protein">Whey Protein &amp; Isolate</Link>
              </li>
              <li>
                <Link href="/sua-tang-can">Sữa tăng cân Mass Gainer</Link>
              </li>
              <li>
                <Link href="/phuc-hoi-bcaa">BCAA, EAA &amp; Phục hồi cơ</Link>
              </li>
              <li>
                <Link href="/phu-kien-gym">Đai lưng &amp; Phụ kiện tập nặng</Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hotline CSKH 1900 8899 & Đăng ký */}
          <div>
            <h3 className="footer-col-title">Tổng Đài CSKH &amp; Hỗ Trợ</h3>
            <div className="space-y-2 mb-4 text-xs text-muted-foreground">
              <div className="footer-contact-item">
                <PhoneCall size={16} className="text-primary flex-shrink-0" />
                <div>
                  <span className="block text-[11px] text-subtle-foreground">
                    Hotline tư vấn &amp; CSKH (8:00 - 22:00)
                  </span>
                  <a
                    href="tel:19008899"
                    className="text-base font-extrabold text-primary hover:underline font-heading tracking-wide"
                  >
                    1900 8899
                  </a>
                </div>
              </div>

              <div className="footer-contact-item">
                <Clock size={16} className="text-subtle-foreground flex-shrink-0" />
                <span>Thứ 2 - Chủ Nhật: 08:00 - 22:00 (Kể cả ngày lễ)</span>
              </div>

              <div className="footer-contact-item">
                <Mail size={16} className="text-subtle-foreground flex-shrink-0" />
                <a
                  href="mailto:support@titanfit.vn"
                  className="hover:text-foreground"
                >
                  support@titanfit.vn
                </a>
              </div>

              <div className="footer-contact-item">
                <MapPin size={16} className="text-subtle-foreground flex-shrink-0" />
                <span>
                  Tầng 5, Tòa nhà Titan Sport Center, 88 Hoàng Cầu, Đống Đa, Hà Nội
                </span>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <span className="text-[12px] font-semibold text-foreground block mb-1">
                Nhận voucher 100K cho đơn đầu tiên:
              </span>
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field text-xs h-9 bg-secondary"
                />
                <button
                  type="submit"
                  className="btn btn-primary h-9 px-3 text-xs"
                  aria-label="Đăng ký nhận tin"
                >
                  <Send size={14} />
                </button>
              </form>
              {subscribed && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Đăng ký thành công! Mã 100K đã gửi về email.</span>
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div className="payment-badges-row">
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">MASTERCARD</span>
              <span className="payment-badge">VNPAY</span>
              <span className="payment-badge">MOMO</span>
              <span className="payment-badge">COD</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="footer-bottom">
          <p>© 2026 TITANFIT Sports &amp; Nutrition. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dieu-khoan" className="hover:text-foreground">
              Điều khoản dịch vụ
            </Link>
            <span>•</span>
            <Link href="/chinh-sach-bao-mat" className="hover:text-foreground">
              Chính sách bảo mật
            </Link>
            <span>•</span>
            <Link href="/quy-che-hoat-dong" className="hover:text-foreground">
              Quy chế hoạt động sàn TMĐT
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
