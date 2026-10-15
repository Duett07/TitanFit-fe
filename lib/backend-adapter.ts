import { ProductDetail, ProductVariantOption, ProductVariantSKU } from "@/data/products";
import productApiRequest from "@/apiRequest/product";
import { BackendProductDetail, BackendProductSummary, BackendVariant, BackendCategory } from "@/types/product.type";

export type { BackendVariant, BackendCategory, BackendProductDetail, BackendProductSummary };

// Slug alias dictionary to support demo URLs & wireframe slugs
export const SLUG_ALIASES: Record<string, string> = {
  "whey-gold-standard-100-isolate-5lbs": "whey-gold-standard-100",
  "ao-thun-pro-combat-co-gian-4-chieu": "ao-thun-the-thao-titanfit-dry-fit-athletics",
  "creatine-monohydrate-pure-300g": "creatine-ostrovit-monohydrate-500g",
  "pre-workout-c4-original-30-servings": "cellucor-c4-original-pre-workout",
  "bcaa-xtend-30-servings": "scivation-xtend-bcaa-30-servings",
  "titan-platinum-hydro-whey-1-6kg": "rule-1-protein-isolate",
};

/**
 * Smart parser that parses variantName into option dimensions
 * Examples:
 * - "Màu Xám - Size M" -> { "Kích thước (Size)": "Size M", "Màu sắc": "Màu Xám" }
 * - "Size S (Eo 60-75cm) - Đen" -> { "Kích thước (Size)": "Size S (Eo 60-75cm)", "Màu sắc": "Đen" }
 * - "Vị Delicious Strawberry (5 Lbs / 2.27kg)" -> { "Hương Vị": "Delicious Strawberry", "Khối lượng": "5 Lbs (2.27kg)" }
 */
export function parseVariantName(
  variantName: string,
  isApparel: boolean
): { option1Name: string; option1Val: string; option2Name?: string; option2Val?: string } {
  // Pattern 1: Hyphen separated (e.g. "Màu Xám - Size M" or "Size S - Đen")
  if (variantName.includes(" - ")) {
    const [partA, partB] = variantName.split(" - ").map((s) => s.trim());
    const isPartASize = /size/i.test(partA);
    const isPartBSize = /size/i.test(partB);

    if (isPartBSize) {
      return {
        option1Name: "Kích thước (Size)",
        option1Val: partB,
        option2Name: "Màu sắc",
        option2Val: partA,
      };
    } else if (isPartASize) {
      return {
        option1Name: "Kích thước (Size)",
        option1Val: partA,
        option2Name: "Màu sắc",
        option2Val: partB,
      };
    } else {
      return {
        option1Name: "Phân loại 1",
        option1Val: partA,
        option2Name: "Phân loại 2",
        option2Val: partB,
      };
    }
  }

  // Pattern 2: Parentheses separated (e.g. "Vị Delicious Strawberry (5 Lbs / 2.27kg)")
  const parenMatch = variantName.match(/^(?:Vị\s+)?(.*?)\s*\((.*?)\)$/i);
  if (parenMatch) {
    const flavor = parenMatch[1].trim();
    const spec = parenMatch[2].trim();
    return {
      option1Name: "Hương Vị",
      option1Val: flavor,
      option2Name: spec.includes("lb") || spec.includes("kg") || spec.includes("g") ? "Khối lượng" : "Quy cách",
      option2Val: spec,
    };
  }

  // Pattern 3: Single dimension or trailing weight
  const weightMatch = variantName.match(/^(.*?)\s+(\d+(?:\.\d+)?\s*(?:g|kg|lbs?|ml))$/i);
  if (weightMatch) {
    return {
      option1Name: isApparel ? "Phân loại" : "Hương Vị",
      option1Val: weightMatch[1].trim(),
      option2Name: "Khối lượng / Dung tích",
      option2Val: weightMatch[2].trim(),
    };
  }

  // Fallback: single option
  return {
    option1Name: isApparel ? "Phân loại" : "Hương Vị",
    option1Val: variantName.trim(),
  };
}

/**
 * Transforms Backend ProductDetailResponse into Frontend ProductDetail structure
 */
export function transformBackendProductDetail(beProduct: BackendProductDetail): ProductDetail {
  const catTree = (beProduct.category?.categoryTree || "").toLowerCase();
  const catSlug = (beProduct.category?.slug || "").toLowerCase();
  const isApparel =
    catSlug.includes("quan-ao") ||
    catSlug.includes("phu-kien") ||
    catSlug.includes("apparel") ||
    catTree.includes("thoi-trang");

  const optionGroups: Record<string, Set<string>> = {};
  const mappedVariants: ProductVariantSKU[] = [];

  beProduct.variants.forEach((v) => {
    const parsed = parseVariantName(v.variantName, isApparel);

    if (!optionGroups[parsed.option1Name]) {
      optionGroups[parsed.option1Name] = new Set();
    }
    optionGroups[parsed.option1Name].add(parsed.option1Val);

    const optionsMap: Record<string, string> = {
      [parsed.option1Name]: parsed.option1Val,
    };

    if (parsed.option2Name && parsed.option2Val) {
      if (!optionGroups[parsed.option2Name]) {
        optionGroups[parsed.option2Name] = new Set();
      }
      optionGroups[parsed.option2Name].add(parsed.option2Val);
      optionsMap[parsed.option2Name] = parsed.option2Val;
    }

    mappedVariants.push({
      id: v.id,
      sku: v.sku,
      options: optionsMap,
      price: v.price,
      originalPrice: Math.round(v.price * 1.15),
      stock: v.stockQuantity,
    });
  });

  const variantOptions: ProductVariantOption[] = Object.entries(optionGroups).map(
    ([name, valSet]) => ({
      name,
      values: Array.from(valSet),
    })
  );

  // Supplemental image gallery
  const galleryImages = [
    beProduct.thumbnailUrl,
    "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
  ];

  return {
    id: beProduct.id,
    slug: beProduct.slug,
    name: beProduct.name,
    category: isApparel ? "apparel" : "supplements",
    categoryLabel: beProduct.category?.name || (isApparel ? "Đồ Thể Thao" : "Thực Phẩm Bổ Sung"),
    price: beProduct.basePrice || (mappedVariants[0]?.price ?? 0),
    originalPrice: Math.round((beProduct.basePrice || mappedVariants[0]?.price || 0) * 1.15),
    badge: isApparel ? "Chính Hãng" : "Top 1 Bán Chạy",
    image: beProduct.thumbnailUrl,
    images: galleryImages,
    actionText: "Xem chi tiết",
    rating: 4.9,
    reviewCount: 128,
    salesCount: 450,
    description: beProduct.description,
    variantOptions,
    variants: mappedVariants,
    specs: isApparel
      ? [
          { label: "Chất liệu", value: "88% Polyester, 12% Spandex co giãn 4 chiều" },
          { label: "Công nghệ", value: "Dri-FIT thoáng khí, kháng khuẩn" },
          { label: "Bảo hành", value: "Đổi size miễn phí trong 7 ngày" },
        ]
      : [
          { label: "Tiêu chuẩn", value: "100% Chính hãng nhập khẩu Hoa Kỳ" },
          { label: "Hàm lượng", value: "Đầy đủ dưỡng chất tinh khiết" },
          { label: "Bảo quản", value: "Nơi khô ráo, tránh ánh nắng trực tiếp" },
        ],
    features: [
      "100% Nhập khẩu chính hãng có tem phụ kiểm định",
      "Giao hàng hỏa tốc trong 24 giờ",
      "Đổi trả miễn phí trong 7 ngày",
    ],
  };
}

/**
 * Transforms Backend ProductSummaryResponse item into ProductDetail / Card format
 */
export function transformBackendProductSummary(item: BackendProductSummary): ProductDetail {
  const isApparel =
    item.categorySlug.includes("quan-ao") ||
    item.categorySlug.includes("phu-kien") ||
    item.categorySlug.includes("binh-lac") ||
    item.categorySlug.includes("do-the-thao") ||
    item.categorySlug.includes("apparel");

  const minPrice = item.basePrice || (item.variants?.[0]?.price ?? 0);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: isApparel ? "apparel" : "supplements",
    categoryLabel: item.categoryName,
    price: minPrice,
    originalPrice: Math.round(minPrice * 1.15),
    badge: isApparel ? "Mới Nhất" : "Bán Chạy",
    image: item.thumbnailUrl,
    images: [item.thumbnailUrl],
    actionText: "Xem chi tiết",
    rating: 4.8,
    reviewCount: 95,
    salesCount: 300,
    description: item.name,
    variantOptions: [],
    variants: (item.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      options: { "Phân loại": v.variantName },
      price: v.price,
      originalPrice: Math.round(v.price * 1.15),
      stock: v.stockQuantity,
    })),
    specs: [],
  };
}

/**
 * Fetch product detail using productApiRequest (Axios HTTP client)
 */
export async function fetchBackendProductDetail(slug: string): Promise<ProductDetail | null> {
  const targetSlug = SLUG_ALIASES[slug] || slug;

  try {
    const res = await productApiRequest.getProductBySlug(targetSlug);
    if (res.data && res.data.data) {
      return transformBackendProductDetail(res.data.data);
    }
  } catch (err) {
    console.warn(`[BackendAdapter] Failed to fetch product "${targetSlug}" via productApiRequest:`, err);
  }

  return null;
}

/**
 * Fetch list of all products using productApiRequest (Axios HTTP client)
 */
export async function fetchBackendProducts(): Promise<ProductDetail[] | null> {
  try {
    const res = await productApiRequest.getProducts({ page: 0, size: 50 });
    const content = res.data?.data?.content;
    if (Array.isArray(content) && content.length > 0) {
      return content.map(transformBackendProductSummary);
    }
  } catch (err) {
    console.warn(`[BackendAdapter] Failed to fetch products list via productApiRequest:`, err);
  }
  return null;
}
