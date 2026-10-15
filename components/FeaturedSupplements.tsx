"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface SupplementItem {
  id: number;
  name: string;
  category: string;
  price: string;
  delPrice?: string;
  badge?: string;
  image: string;
  actionText: string;
}

const supplements: SupplementItem[] = [
  {
    id: 1,
    name: "Whey Gold Standard 100% Isolate (5 lbs)",
    category: "Whey Isolate",
    price: "1.850.000 ₫",
    delPrice: "2.100.000 ₫",
    badge: "Nổi Bật",
    image: "/images/products/titan-iso-whey.jpg",
    actionText: "Chọn Vị & Size",
  },
  {
    id: 2,
    name: "Creatine Monohydrate Pure 300g (60 Servings)",
    category: "Tăng Sức Mạnh",
    price: "520.000 ₫",
    delPrice: "600.000 ₫",
    badge: "HOT",
    image: "/images/products/titan-creatine.jpg",
    actionText: "Chi Tiết",
  },
  {
    id: 3,
    name: "Pre-Workout C4 Original 30 Servings Táo Xanh",
    category: "Pre-Workout",
    price: "690.000 ₫",
    badge: "HOT",
    image: "/images/products/pre-workout-c4.jpg",
    actionText: "Chi Tiết",
  },
  {
    id: 4,
    name: "BCAA Xtend 30 Servings Chống Dị Hóa Cơ",
    category: "Phục Hồi Cơ",
    price: "580.000 ₫",
    badge: "BEST SELLER",
    image: "/images/products/bcaa-xtend.jpg",
    actionText: "Chi Tiết",
  },
];

export default function FeaturedSupplements() {
  const [toastText, setToastText] = useState<string | null>(null);

  const handleAddToCart = (name: string) => {
    setToastText(`Đã thêm "${name}" vào giỏ hàng!`);
    setTimeout(() => setToastText(null), 3000);
  };

  return (
    <section style={{ padding: "20px 0 40px" }}>
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
              Bán Chạy Nhất
            </span>
            <h2 className="font-heading" style={{ fontSize: "24px" }}>
              Thực Phẩm Bổ Sung Nổi Bật
            </h2>
          </div>
          <Link
            href="/products?category=supplements"
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
          {supplements.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-thumb-wrap">
                {product.badge && (
                  <span className="badge badge-primary product-tag">
                    {product.badge}
                  </span>
                )}
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <Link
                  href={`/product-detail?id=${product.id}`}
                  className="product-name"
                >
                  {product.name}
                </Link>
                <div className="product-price-row">
                  <span className="price-main">{product.price}</span>
                  {product.delPrice && (
                    <span className="price-del">{product.delPrice}</span>
                  )}
                </div>
                <div className="product-actions">
                  <Link
                    href={`/product-detail?id=${product.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    {product.actionText}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-icon"
                    onClick={() => handleAddToCart(product.name)}
                    title="Thêm vào giỏ"
                    aria-label={`Thêm ${product.name} vào giỏ hàng`}
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
