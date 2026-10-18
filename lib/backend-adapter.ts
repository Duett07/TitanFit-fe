import { ProductDetail, ProductVariantOption, ProductVariantSKU } from "@/data/products";
import { BackendProductDetail, BackendProductSummary, BackendVariant, BackendCategory } from "@/types/product.type";

export type { BackendVariant, BackendCategory, BackendProductDetail, BackendProductSummary };


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
      stock: v.stockQuantity,
    });
  });

  const variantOptions: ProductVariantOption[] = Object.entries(optionGroups).map(
    ([name, valSet]) => ({
      name,
      values: Array.from(valSet),
    })
  );

  // Real product images from thumbnail and variant images only
  const allImages = [
    beProduct.thumbnailUrl,
    ...beProduct.variants.map((v) => v.imageUrl),
  ].filter((img): img is string => Boolean(img && img.trim()));
  const uniqueImages = Array.from(new Set(allImages));
  const galleryImages =
    uniqueImages.length > 0
      ? uniqueImages
      : beProduct.thumbnailUrl
      ? [beProduct.thumbnailUrl]
      : [];

  return {
    id: beProduct.id,
    slug: beProduct.slug,
    name: beProduct.name,
    category: isApparel ? "apparel" : "supplements",
    categoryLabel: beProduct.category?.name || (isApparel ? "Đồ Thể Thao" : "Thực Phẩm Bổ Sung"),
    price: beProduct.basePrice || (mappedVariants[0]?.price ?? 0),
    image: beProduct.thumbnailUrl,
    images: galleryImages,
    actionText: "Xem chi tiết",
    description: beProduct.description,
    variantOptions,
    variants: mappedVariants,
    specs: [],
    features: [],
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
    image: item.thumbnailUrl,
    images: [item.thumbnailUrl],
    actionText: "Xem chi tiết",
    description: item.name,
    variantOptions: [],
    variants: (item.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      options: { "Phân loại": v.variantName },
      price: v.price,
      stock: v.stockQuantity,
    })),
    specs: [],
  };
}

