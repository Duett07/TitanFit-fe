import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/data/products";
import { fetchBackendProducts } from "@/lib/backend-adapter";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    let backendProducts = await fetchBackendProducts();

    if (backendProducts && backendProducts.length > 0) {
      if (category && category !== "all") {
        backendProducts = backendProducts.filter((p) => p.category === category);
      }
      return NextResponse.json(
        {
          success: true,
          data: backendProducts,
          total: backendProducts.length,
          source: "spring_boot_backend",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: PRODUCTS,
        total: PRODUCTS.length,
        source: "local_fallback",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi lấy danh sách sản phẩm",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
