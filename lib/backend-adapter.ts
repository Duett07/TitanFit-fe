import { UIProductDetail, ProductVariantOption, ProductVariantSKU } from "@/data/products";
import { ProductDetailDto, ProductSummaryDto, VariantDto } from "@/types/product.type";

/**
 * Smart parser that parses variantName into option dimensions
 * Examples:
 * - "Màu Xám - Size M" -> { "Kích thước (Size)": "Size M", "Màu sắc": "Màu Xám" }
 * - "Size S (Eo 60-75cm) - Đen" -> { "Kích thước (Size)": "Size S (Eo 60-75cm)", "Màu sắc": "Đen" }
 * - "Vị Delicious Strawberry (5 Lbs / 2.27kg)" -> { "Hương Vị": "Delicious Strawberry", "Khối lượng": "5 Lbs (2.27kg)" }
 */
export function parseVariantName(
  variantName?: string | null,
  isApparel: boolean = false
): { option1Name: string; option1Val: string; option2Name?: string; option2Val?: string } {
  const safeName = (variantName || "").trim();
  if (!safeName) {
    return {
      option1Name: isApparel ? "Kích thước (Size)" : "Phân loại",
      option1Val: "Tiêu chuẩn",
    };
  }

  // Helper matchers
  const isSize = (str: string) =>
    /^(size\s*)?([x|2|3|4|5]*[s|m|l]|free\s*size|\d{2,3})$/i.test(str.trim()) ||
    /\bsize\b/i.test(str);

  const isWeight = (str: string) =>
    /\b(\d+(?:\.\d+)?\s*(?:g|kg|lbs?|ml|l|oz|servings?|viên|gói))\b/i.test(str) ||
    /^(hộp|gói|túi|chai|lọ|bình)/i.test(str);

  const isColor = (str: string) => {
    const s = str.toLowerCase();
    const colors = [
      "màu",
      "color",
      "đen",
      "trắng",
      "xám",
      "xanh",
      "đỏ",
      "vàng",
      "cam",
      "tím",
      "hồng",
      "black",
      "white",
      "grey",
      "gray",
      "blue",
      "red",
      "navy",
      "beige",
    ];
    return colors.some((c) => s.includes(c));
  };

  // Pattern 1: Parentheses separated (e.g. "Vị Delicious Strawberry (5 Lbs / 2.27kg)")
  // Checked first to avoid delimiters inside parentheses breaking the name
  const parenMatch = safeName.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    const mainPart = parenMatch[1].trim().replace(/^vị\s+/i, "");
    const subPart = parenMatch[2].trim();
    return {
      option1Name: isApparel ? "Phân loại" : "Hương Vị",
      option1Val: mainPart,
      option2Name: isWeight(subPart) ? "Khối lượng / Quy cách" : "Quy cách",
      option2Val: subPart,
    };
  }

  // Pattern 2: Delimiter separated (" - ", " / ", " | ", or " ; ")
  const delimiterRegex = /\s*(?: - | \/ | \| | ; )\s*/;
  if (delimiterRegex.test(safeName)) {
    const parts = safeName.split(delimiterRegex).filter(Boolean);
    if (parts.length >= 2) {
      const partA = parts[0].trim();
      const partB = parts[1].trim();

      // Case: Size and Color
      if (isSize(partA) && (isColor(partB) || isApparel)) {
        return {
          option1Name: "Kích thước (Size)",
          option1Val: partA,
          option2Name: "Màu sắc",
          option2Val: partB,
        };
      }
      if (isSize(partB)) {
        return {
          option1Name: "Kích thước (Size)",
          option1Val: partB,
          option2Name: isColor(partA) || isApparel ? "Màu sắc" : "Phân loại",
          option2Val: partA,
        };
      }
      if (isWeight(partB)) {
        return {
          option1Name: "Hương Vị",
          option1Val: partA.replace(/^vị\s+/i, ""),
          option2Name: "Khối lượng / Quy cách",
          option2Val: partB,
        };
      }
      if (isWeight(partA)) {
        return {
          option1Name: "Khối lượng / Quy cách",
          option1Val: partA,
          option2Name: "Hương Vị",
          option2Val: partB.replace(/^vị\s+/i, ""),
        };
      }

      return {
        option1Name: isApparel ? "Kích thước (Size)" : "Phân loại 1",
        option1Val: partA,
        option2Name: isApparel ? "Màu sắc" : "Phân loại 2",
        option2Val: partB,
      };
    }
  }

  // Pattern 3: Trailing weight/volume specification
  const weightMatch = safeName.match(
    /^(.*?)\s+(\d+(?:\.\d+)?\s*(?:g|kg|lbs?|ml|l|oz|servings?|viên|gói))$/i
  );
  if (weightMatch) {
    return {
      option1Name: isApparel ? "Phân loại" : "Hương Vị",
      option1Val: weightMatch[1].trim().replace(/^vị\s+/i, ""),
      option2Name: "Khối lượng / Quy cách",
      option2Val: weightMatch[2].trim(),
    };
  }

  // Pattern 4: Single recognized size
  if (isSize(safeName)) {
    return {
      option1Name: "Kích thước (Size)",
      option1Val: safeName,
    };
  }

  // General safe fallback
  return {
    option1Name: isApparel ? "Kích thước (Size)" : "Phân loại",
    option1Val: safeName,
  };
}

/**
 * Transforms Backend ProductDetailResponse into Frontend ProductDetail structure
 */
export function transformBackendProductDetail(beProduct: ProductDetailDto): UIProductDetail {
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
  const allImages = [beProduct.thumbnailUrl, ...beProduct.variants.map((v) => v.imageUrl)].filter(
    (img): img is string => Boolean(img && img.trim())
  );
  const uniqueImages = Array.from(new Set(allImages));
  const galleryImages =
    uniqueImages.length > 0 ? uniqueImages : beProduct.thumbnailUrl ? [beProduct.thumbnailUrl] : [];

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
export function transformBackendProductSummary(item: ProductSummaryDto): UIProductDetail {
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
    variants: (item.variants || []).map((v: VariantDto) => ({
      id: v.id,
      sku: v.sku,
      options: { "Phân loại": v.variantName },
      price: v.price,
      stock: v.stockQuantity,
    })),
    specs: [],
  };
}
