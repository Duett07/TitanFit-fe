export type ProductCategory = "all" | "apparel" | "supplements";

export type PriceFilterKey = "all" | "under500k" | "500k-1tr" | "1tr-2tr" | "over2tr";

export type SortOptionKey = "newest" | "price-asc" | "price-desc";

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: "apparel" | "supplements";
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  actionText: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  salesCount: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "whey-gold-standard-100-isolate-5lbs",
    name: "Whey Gold Standard 100% Isolate (5 lbs)",
    category: "supplements",
    categoryLabel: "Whey Isolate",
    price: 1850000,
    originalPrice: 2100000,
    badge: "Top 1 Whey",
    image: "/images/products/titan-iso-whey.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 142,
    isNew: false,
    salesCount: 850,
  },
  {
    id: 2,
    slug: "creatine-monohydrate-pure-300g",
    name: "Creatine Monohydrate Pure 300g (60 Servings)",
    category: "supplements",
    categoryLabel: "Tăng Sức Mạnh",
    price: 520000,
    originalPrice: 600000,
    badge: "HOT",
    image: "/images/products/titan-creatine.jpg",
    actionText: "Xem chi tiết",
    rating: 4.8,
    reviewCount: 96,
    isNew: false,
    salesCount: 520,
  },
  {
    id: 3,
    slug: "pre-workout-c4-original-30-servings",
    name: "Pre-Workout C4 Original 30 Servings Táo Xanh",
    category: "supplements",
    categoryLabel: "Pre-Workout",
    price: 690000,
    originalPrice: 790000,
    badge: "BEST SELLER",
    image: "/images/products/pre-workout-c4.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 88,
    isNew: false,
    salesCount: 430,
  },
  {
    id: 4,
    slug: "bcaa-xtend-30-servings",
    name: "BCAA Xtend 30 Servings Chống Dị Hóa Cơ",
    category: "supplements",
    categoryLabel: "Phục Hồi Cơ",
    price: 580000,
    badge: "Chính Hãng",
    image: "/images/products/bcaa-xtend.jpg",
    actionText: "Xem chi tiết",
    rating: 4.7,
    reviewCount: 64,
    isNew: false,
    salesCount: 310,
  },
  {
    id: 5,
    slug: "titan-platinum-hydro-whey-1-6kg",
    name: "Titan Platinum Hydro Whey 1.6kg Siêu Tinh Khiết",
    category: "supplements",
    categoryLabel: "Hydrolyzed Whey",
    price: 2350000,
    originalPrice: 2600000,
    badge: "PREMIUM",
    image: "/images/products/titan-hydro-whey.jpg",
    actionText: "Xem chi tiết",
    rating: 5.0,
    reviewCount: 51,
    isNew: true,
    salesCount: 190,
  },
  {
    id: 6,
    slug: "titan-mass-creatine-tang-can-nhanh-12lbs",
    name: "Titan Mass Gainer & Creatine Tăng Cân Nhanh (12 lbs)",
    category: "supplements",
    categoryLabel: "Sữa Tăng Cân",
    price: 2150000,
    originalPrice: 2450000,
    badge: "TĂNG CÂN",
    image: "/images/products/titan-mass-creatine.jpg",
    actionText: "Xem chi tiết",
    rating: 4.8,
    reviewCount: 72,
    isNew: true,
    salesCount: 260,
  },
  {
    id: 7,
    slug: "ao-thun-pro-combat-co-gian-4-chieu",
    name: "Áo Thun Pro-Combat Co Giãn 4 Chiều Thoáng Khí",
    category: "apparel",
    categoryLabel: "Đồ Tập Nam",
    price: 320000,
    originalPrice: 400000,
    badge: "MỚI",
    image: "/images/products/ao-pro-combat.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 210,
    isNew: true,
    salesCount: 1100,
  },
  {
    id: 8,
    slug: "quan-short-gym-2-lop-co-gian-khoa-zip",
    name: "Quần Short Gym 2 Lớp Co Giãn Có Túi Khóa Zip",
    category: "apparel",
    categoryLabel: "Quần Tập Gym",
    price: 280000,
    originalPrice: 350000,
    badge: "HOT",
    image: "/images/products/quan-short-2-lop.jpg",
    actionText: "Xem chi tiết",
    rating: 4.8,
    reviewCount: 175,
    isNew: true,
    salesCount: 890,
  },
  {
    id: 9,
    slug: "dai-lung-cung-squat-the-hinh-da-bo",
    name: "Đai Lưng Cứng Squat Thể Hình Da Bò Cao Cấp",
    category: "apparel",
    categoryLabel: "Phụ Kiện Gymer",
    price: 650000,
    originalPrice: 750000,
    badge: "PRO GYM",
    image: "/images/products/dai-lung-squat.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 130,
    isNew: false,
    salesCount: 480,
  },
  {
    id: 10,
    slug: "binh-lac-gym-inox-304-giu-nhiet-750ml",
    name: "Bình Lắc Gym Inox 304 Giữ Nhiệt Cao Cấp 750ml",
    category: "apparel",
    categoryLabel: "Phụ Kiện Gymer",
    price: 240000,
    originalPrice: 300000,
    badge: "BEST SELLER",
    image: "/images/products/binh-shaker-inox.jpg",
    actionText: "Xem chi tiết",
    rating: 4.7,
    reviewCount: 95,
    isNew: false,
    salesCount: 620,
  },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}
