"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface ApparelItem {
  id: number;
  name: string;
  category: string;
  price: string;
  delPrice?: string;
  badge?: string;
  image: string;
  actionText: string;
}

const apparelList: ApparelItem[] = [
  {
    id: 5,
    name: "Áo Thun Pro-Combat Co Giãn 4 Chiều",
    category: "Áo Tập Nam",
    price: "320.000 ₫",
    delPrice: "400.000 ₫",
    badge: "-20%",
    image: "/images/products/ao-pro-combat.jpg",
    actionText: "Chọn Size S - XL",
  },
  {
    id: 6,
    name: "Quần Short 2 Lớp Co Giãn Có Túi Khóa",
    category: "Quần Tập Gym",
    price: "280.000 ₫",
    badge: "HOT",
    image: "/images/products/quan-short-2-lop.jpg",
    actionText: "Chọn Size",
  },
  {
    id: 7,
    name: "Bình Lắc Shaker Inox 700ml Giữ Nhiệt",
    category: "Phụ Kiện Gymer",
    price: "240.000 ₫",
    image: "/images/products/binh-shaker-inox.jpg",
    actionText: "Chi Tiết",
  },
  {
    id: 8,
    name: "Đai Lưng Squat Da Bò Chuyên Dụng",
    category: "Bảo Hộ Tập Nặng",
    price: "490.000 ₫",
    delPrice: "590.000 ₫",
    badge: "-17%",
    image: "/images/products/dai-lung-squat.jpg",
    actionText: "Chọn Size",
  },
];

export default function FeaturedApparel() {
  const [toastText, setToastText] = useState<string | null>(null);

  const handleAddToCart = (name: string) => {
    setToastText(`Đã thêm "${name}" vào giỏ hàng!`);
    setTimeout(() => setToastText(null), 3000);
  };

  return (
    <section style={{ padding: "10px 0 50px" }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "20px",
          }}
        >
          <div>
            <span className="badge badge-default" style={{ marginBottom: "6px" }}>
              Thời Trang Phòng Gym
            </span>
            <h2 className="font-heading" style={{ fontSize: "24px" }}>
              Đồ Tập &amp; Phụ Kiện Thể Thao
            </h2>
          </div>
          <Link
            href="/products?category=apparel"
            className="btn btn-ghost btn-sm"
          >
            <span>Xem tất cả</span>
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
          </Link>
        </div>

        {/* Product Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {apparelList.map((item) => (
            <div key={item.id} className="product-card">
              <div className="product-thumb-wrap">
                {item.badge && (
                  <span className="badge badge-default product-tag">
                    {item.badge}
                  </span>
                )}
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="product-info">
                <span className="product-category">{item.category}</span>
                <Link
                  href={`/product-detail?id=${item.id}`}
                  className="product-name"
                >
                  {item.name}
                </Link>
                <div className="product-price-row">
                  <span className="price-main">{item.price}</span>
                  {item.delPrice && (
                    <span className="price-del">{item.delPrice}</span>
                  )}
                </div>
                <div className="product-actions">
                  <Link
                    href={`/product-detail?id=${item.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    {item.actionText}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-icon"
                    onClick={() => handleAddToCart(item.name)}
                    title="Thêm vào giỏ"
                    aria-label={`Thêm ${item.name} vào giỏ hàng`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {toastText && (
        <div className="toast-container">
          <div className="toast show">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastText}</span>
          </div>
        </div>
      )}
    </section>
  );
}
