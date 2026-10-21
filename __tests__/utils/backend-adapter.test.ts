import { describe, it, expect } from "vitest";
import { parseVariantName } from "@/lib/backend-adapter";
import { extractProductsList } from "@/hooks/queries/useProducts";

describe("parseVariantName", () => {
  describe("empty or null input", () => {
    it("returns default fallback for supplements", () => {
      const result = parseVariantName(null, false);
      expect(result).toEqual({
        option1Name: "Phân loại",
        option1Val: "Tiêu chuẩn",
      });
    });

    it("returns default fallback for apparel", () => {
      const result = parseVariantName("", true);
      expect(result).toEqual({
        option1Name: "Kích thước (Size)",
        option1Val: "Tiêu chuẩn",
      });
    });
  });

  describe("apparel variants (Size and Color)", () => {
    it("correctly parses 'Size M - Màu Xám'", () => {
      const result = parseVariantName("Size M - Màu Xám", true);
      expect(result.option1Name).toBe("Kích thước (Size)");
      expect(result.option1Val).toBe("Size M");
      expect(result.option2Name).toBe("Màu sắc");
      expect(result.option2Val).toBe("Màu Xám");
    });

    it("correctly parses reversed order 'Đen - Size L'", () => {
      const result = parseVariantName("Đen - Size L", true);
      expect(result.option1Name).toBe("Kích thước (Size)");
      expect(result.option1Val).toBe("Size L");
      expect(result.option2Name).toBe("Màu sắc");
      expect(result.option2Val).toBe("Đen");
    });

    it("correctly parses single size 'Size XL'", () => {
      const result = parseVariantName("Size XL", true);
      expect(result.option1Name).toBe("Kích thước (Size)");
      expect(result.option1Val).toBe("Size XL");
    });
  });

  describe("supplements and nutrition variants", () => {
    it("correctly parses delimiter separated 'Chocolate - 5 Lbs'", () => {
      const result = parseVariantName("Chocolate - 5 Lbs", false);
      expect(result.option1Name).toBe("Hương Vị");
      expect(result.option1Val).toBe("Chocolate");
      expect(result.option2Name).toBe("Khối lượng / Quy cách");
      expect(result.option2Val).toBe("5 Lbs");
    });

    it("correctly parses parenthesized 'Vị Delicious Strawberry (5 Lbs / 2.27kg)'", () => {
      const result = parseVariantName("Vị Delicious Strawberry (5 Lbs / 2.27kg)", false);
      expect(result.option1Name).toBe("Hương Vị");
      expect(result.option1Val).toBe("Delicious Strawberry");
      expect(result.option2Name).toBe("Khối lượng / Quy cách");
      expect(result.option2Val).toBe("5 Lbs / 2.27kg");
    });

    it("correctly parses trailing weight 'Vị Vanilla 2kg'", () => {
      const result = parseVariantName("Vị Vanilla 2kg", false);
      expect(result.option1Name).toBe("Hương Vị");
      expect(result.option1Val).toBe("Vanilla");
      expect(result.option2Name).toBe("Khối lượng / Quy cách");
      expect(result.option2Val).toBe("2kg");
    });
  });
});

describe("extractProductsList", () => {
  it("returns the array directly if raw input is an array", () => {
    const mockProducts = [{ id: "p1", name: "Whey Gold" }];
    expect(extractProductsList(mockProducts)).toEqual(mockProducts);
  });

  it("extracts content array from Spring Boot PageResponse object", () => {
    const mockPage = {
      content: [{ id: "p1", name: "Whey Gold" }],
      pageNo: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };
    expect(extractProductsList(mockPage)).toEqual([{ id: "p1", name: "Whey Gold" }]);
  });

  it("returns empty array for invalid, null, or undefined data", () => {
    expect(extractProductsList(null)).toEqual([]);
    expect(extractProductsList(undefined)).toEqual([]);
    expect(extractProductsList({})).toEqual([]);
    expect(extractProductsList({ content: "not-an-array" })).toEqual([]);
    expect(extractProductsList("invalid")).toEqual([]);
  });
});
