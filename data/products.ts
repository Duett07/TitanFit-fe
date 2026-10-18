export type ProductCategory = "all" | "apparel" | "supplements";

export type PriceFilterKey = "all" | "under500k" | "500k-1tr" | "1tr-2tr" | "over2tr";

export type SortOptionKey = "newest" | "price-asc" | "price-desc";

export interface Product {
  id: number | string;
  slug: string;
  name: string;
  category: "apparel" | "supplements";
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  actionText: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  salesCount?: number;
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

export { formatVND } from "@/lib/format";


export interface ProductVariantOption {
  name: string; // e.g. "Kích thước (Size)" or "Hương Vị"
  values: string[];
}

export interface ProductVariantSKU {
  id?: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
}

export interface ProductDetail extends Product {
  description: string;
  images: string[];
  variantOptions: ProductVariantOption[];
  variants: ProductVariantSKU[];
  specs: { label: string; value: string }[];
  features?: string[];
}

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  // 1. Mẫu Thực phẩm bổ sung: Whey Gold Standard 100% Isolate
  "whey-gold-standard-100-isolate-5lbs": {
    id: 1,
    slug: "whey-gold-standard-100-isolate-5lbs",
    name: "Whey Gold Standard 100% Isolate Tăng Cơ Nạc Siêu Tinh Khiết",
    category: "supplements",
    categoryLabel: "Thực Phẩm Bổ Sung",
    price: 1850000,
    originalPrice: 2100000,
    badge: "Top 1 Whey",
    image: "/images/products/titan-iso-whey.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 142,
    salesCount: 850,
    description:
      "Công thức 100% Whey Protein Isolate cao cấp hỗ trợ phục hồi và phát triển cơ bắp nạc tối đa, ít lactose, không chứa chất béo thừa. Mỗi lần dùng cung cấp 25g Protein tinh khiết và 5.5g BCAA tự nhiên.",
    images: [
      "/images/products/titan-iso-whey.jpg",
      "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    ],
    variantOptions: [
      {
        name: "Hương Vị",
        values: ["Double Rich Chocolate", "Vanilla Ice Cream", "Banana Cream (Chuối)"],
      },
      {
        name: "Khối lượng",
        values: ["2 lbs (907g)", "5 lbs (2.27kg)"],
      },
    ],
    variants: [
      {
        sku: "WHEY-ISO-CHOC-5LBS",
        options: { "Hương Vị": "Double Rich Chocolate", "Khối lượng": "5 lbs (2.27kg)" },
        price: 1850000,
        originalPrice: 2100000,
        stock: 24,
      },
      {
        sku: "WHEY-ISO-CHOC-2LBS",
        options: { "Hương Vị": "Double Rich Chocolate", "Khối lượng": "2 lbs (907g)" },
        price: 950000,
        originalPrice: 1100000,
        stock: 15,
      },
      {
        sku: "WHEY-ISO-VANI-5LBS",
        options: { "Hương Vị": "Vanilla Ice Cream", "Khối lượng": "5 lbs (2.27kg)" },
        price: 1850000,
        originalPrice: 2100000,
        stock: 8,
      },
      {
        // OUT OF STOCK DEMO: Vani 2lbs
        sku: "WHEY-ISO-VANI-2LBS",
        options: { "Hương Vị": "Vanilla Ice Cream", "Khối lượng": "2 lbs (907g)" },
        price: 950000,
        originalPrice: 1100000,
        stock: 0,
      },
      {
        sku: "WHEY-ISO-BANANA-5LBS",
        options: { "Hương Vị": "Banana Cream (Chuối)", "Khối lượng": "5 lbs (2.27kg)" },
        price: 1850000,
        originalPrice: 2100000,
        stock: 12,
      },
      {
        // OUT OF STOCK DEMO: Chuối 2lbs
        sku: "WHEY-ISO-BANANA-2LBS",
        options: { "Hương Vị": "Banana Cream (Chuối)", "Khối lượng": "2 lbs (907g)" },
        price: 950000,
        originalPrice: 1100000,
        stock: 0,
      },
    ],
    specs: [
      { label: "Protein Isolate tinh khiết", value: "25g / lần dùng" },
      { label: "BCAA phục hồi cơ", value: "5.5g" },
      { label: "Glutamine chống dị hóa", value: "4.3g" },
      { label: "Lactose / Chất béo", value: "Gần như 0g (< 1g)" },
      { label: "Xuất xứ", value: "Hoa Kỳ (USA) - 100% Chính Hãng" },
    ],
    features: [
      "100% Whey Isolate hấp thụ siêu nhanh trong 15-30 phút sau tập",
      "Công nghệ lọc cross-flow microfiltration giữ nguyên cấu trúc sinh học",
      "Hòa tan tức thì chỉ với vài lần lắc cùng bình shaker",
    ],
  },

  // 2. Mẫu Đồ thể thao: Áo Thun Pro-Combat Compression
  "ao-thun-pro-combat-co-gian-4-chieu": {
    id: 7,
    slug: "ao-thun-pro-combat-co-gian-4-chieu",
    name: "Áo Thun Tập Gym Pro-Combat Compression Co Giãn 4 Chiều",
    category: "apparel",
    categoryLabel: "Đồ Tập Thể Thao",
    price: 320000,
    originalPrice: 400000,
    badge: "MỚI",
    image: "/images/products/ao-pro-combat.jpg",
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 210,
    salesCount: 1100,
    description:
      "Áo thun compression ôm sát tôn cơ bắp, hỗ trợ lưu thông máu và giảm rung lắc cơ trong các bài đẩy ngực hay squat nặng. Vải Spandex cao cấp co giãn 4 chiều, khử mùi và khô nhanh sau 15 phút.",
    images: [
      "/images/products/ao-pro-combat.jpg",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
    ],
    variantOptions: [
      {
        name: "Kích thước (Size)",
        values: ["Size S (50-60kg)", "Size M (60-70kg)", "Size L (70-80kg)", "Size XL (80-92kg)"],
      },
      {
        name: "Màu sắc",
        values: ["Đen Obsidian", "Xám Khói", "Xanh Navy"],
      },
    ],
    variants: [
      // Đen Obsidian
      {
        sku: "PRO-COMBAT-L-DEN",
        options: { "Kích thước (Size)": "Size L (70-80kg)", "Màu sắc": "Đen Obsidian" },
        price: 320000,
        originalPrice: 400000,
        stock: 40,
      },
      {
        sku: "PRO-COMBAT-M-DEN",
        options: { "Kích thước (Size)": "Size M (60-70kg)", "Màu sắc": "Đen Obsidian" },
        price: 320000,
        originalPrice: 400000,
        stock: 25,
      },
      {
        sku: "PRO-COMBAT-S-DEN",
        options: { "Kích thước (Size)": "Size S (50-60kg)", "Màu sắc": "Đen Obsidian" },
        price: 320000,
        originalPrice: 400000,
        stock: 15,
      },
      {
        // OUT OF STOCK DEMO: Size XL Đen
        sku: "PRO-COMBAT-XL-DEN",
        options: { "Kích thước (Size)": "Size XL (80-92kg)", "Màu sắc": "Đen Obsidian" },
        price: 340000,
        originalPrice: 420000,
        stock: 0,
      },
      // Xám Khói
      {
        sku: "PRO-COMBAT-L-XAM",
        options: { "Kích thước (Size)": "Size L (70-80kg)", "Màu sắc": "Xám Khói" },
        price: 320000,
        originalPrice: 400000,
        stock: 18,
      },
      {
        sku: "PRO-COMBAT-M-XAM",
        options: { "Kích thước (Size)": "Size M (60-70kg)", "Màu sắc": "Xám Khói" },
        price: 320000,
        originalPrice: 400000,
        stock: 20,
      },
      {
        sku: "PRO-COMBAT-S-XAM",
        options: { "Kích thước (Size)": "Size S (50-60kg)", "Màu sắc": "Xám Khói" },
        price: 320000,
        originalPrice: 400000,
        stock: 10,
      },
      {
        sku: "PRO-COMBAT-XL-XAM",
        options: { "Kích thước (Size)": "Size XL (80-92kg)", "Màu sắc": "Xám Khói" },
        price: 340000,
        originalPrice: 420000,
        stock: 8,
      },
      // Xanh Navy
      {
        sku: "PRO-COMBAT-L-NAVY",
        options: { "Kích thước (Size)": "Size L (70-80kg)", "Màu sắc": "Xanh Navy" },
        price: 320000,
        originalPrice: 400000,
        stock: 14,
      },
      {
        sku: "PRO-COMBAT-M-NAVY",
        options: { "Kích thước (Size)": "Size M (60-70kg)", "Màu sắc": "Xanh Navy" },
        price: 320000,
        originalPrice: 400000,
        stock: 16,
      },
      {
        // OUT OF STOCK DEMO: Size S Xanh Navy
        sku: "PRO-COMBAT-S-NAVY",
        options: { "Kích thước (Size)": "Size S (50-60kg)", "Màu sắc": "Xanh Navy" },
        price: 320000,
        originalPrice: 400000,
        stock: 0,
      },
      {
        sku: "PRO-COMBAT-XL-NAVY",
        options: { "Kích thước (Size)": "Size XL (80-92kg)", "Màu sắc": "Xanh Navy" },
        price: 340000,
        originalPrice: 420000,
        stock: 6,
      },
    ],
    specs: [
      { label: "Chất liệu vải", value: "88% Polyester, 12% Spandex co giãn 4 chiều" },
      { label: "Công nghệ dệt", value: "Dri-FIT thấm hút mồ hôi, kháng khuẩn" },
      { label: "Form dáng", value: "Pro Compression ôm sát body gymer" },
      { label: "Chính sách đổi trả", value: "Đổi size miễn phí tận nhà trong 7 ngày" },
    ],
    features: [
      "Đường may phẳng Flatlock 4 kim 6 chỉ không gây cọ xát da",
      "Kháng khuẩn Silver-ion ngăn mùi mồ hôi hiệu quả cả buổi tập",
      "In lụa phản quang logo TITANFIT sắc nét, bền màu giặt máy",
    ],
  },
};

// Fallback generator for other products in catalog
export function getProductDetail(slugOrId: string | number): ProductDetail | undefined {
  const slugStr = String(slugOrId);
  // Match curated detail
  if (PRODUCT_DETAILS[slugStr]) {
    return PRODUCT_DETAILS[slugStr];
  }

  // Find base product by slug or id
  const base = PRODUCTS.find(
    (p) => p.slug === slugStr || String(p.id) === slugStr
  );
  if (!base) return undefined;

  // Build standard dynamic variants based on category
  const isApparel = base.category === "apparel";
  const variantOptions: ProductVariantOption[] = isApparel
    ? [
        {
          name: "Kích thước (Size)",
          values: ["Size S", "Size M", "Size L", "Size XL"],
        },
        {
          name: "Màu sắc",
          values: ["Đen TiTan", "Xám Thể Thao", "Xanh Rêu"],
        },
      ]
    : [
        {
          name: "Hương Vị",
          values: ["Socola Đậm Đà", "Vani Tự Nhiên", "Chuối Chín"],
        },
        {
          name: "Khối lượng",
          values: ["2 lbs (907g)", "5 lbs (2.27kg)"],
        },
      ];

  const variants: ProductVariantSKU[] = [];
  variantOptions[0].values.forEach((v1, i1) => {
    variantOptions[1].values.forEach((v2, i2) => {
      // Simulate stock = 0 for some variants for robust grading
      const isOut = i1 === 3 && i2 === 0;
      const priceOffset = !isApparel && v2.includes("2 lbs") ? -Math.round(base.price * 0.45) : 0;
      variants.push({
        sku: `${base.slug.slice(0, 8).toUpperCase()}-${i1}-${i2}`,
        options: {
          [variantOptions[0].name]: v1,
          [variantOptions[1].name]: v2,
        },
        price: base.price + priceOffset,
        originalPrice: base.originalPrice ? base.originalPrice + priceOffset : undefined,
        stock: isOut ? 0 : 15 + ((i1 + i2) * 5),
      });
    });
  });

  return {
    ...base,
    description: `Sản phẩm ${base.name} chính hãng phân phối độc quyền tại TITANFIT. Đạt chuẩn chứng nhận an toàn và hiệu năng thi đấu cao cấp.`,
    images: [
      base.image,
      "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    ],
    variantOptions,
    variants,
    specs: isApparel
      ? [
          { label: "Chất liệu", value: "Polyester & Spandex cao cấp" },
          { label: "Co giãn", value: "4 chiều thể thao chuyên dụng" },
          { label: "Đổi trả", value: "7 ngày miễn phí toàn quốc" },
        ]
      : [
          { label: "Hàm lượng", value: "Chuẩn quốc tế" },
          { label: "Chính hãng", value: "100% Tem phụ nhập khẩu" },
          { label: "Bảo quản", value: "Nơi khô ráo, thoáng mát" },
        ],
    features: [
      "100% Chính hãng nhập khẩu đầy đủ hóa đơn chứng từ",
      "Giao nhanh 24h miễn phí đơn từ 500.000₫",
      "Tư vấn lộ trình dinh dưỡng & tập luyện chuyên sâu",
    ],
  };
}

