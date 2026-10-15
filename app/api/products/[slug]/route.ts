import { NextRequest, NextResponse } from "next/server";
import { getProductDetail } from "@/data/products";
import { fetchBackendProductDetail } from "@/lib/backend-adapter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. First priority: Fetch real product data from Spring Boot Backend
    const backendProduct = await fetchBackendProductDetail(slug);
    if (backendProduct) {
      return NextResponse.json(
        {
          success: true,
          data: backendProduct,
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

    // 2. Fallback: Local curated dataset if BE doesn't have this slug
    const localProduct = getProductDetail(slug);
    if (localProduct) {
      return NextResponse.json(
        {
          success: true,
          data: localProduct,
          source: "local_fallback",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: `Không tìm thấy sản phẩm với mã định danh "${slug}" trên hệ thống Backend`,
      },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi máy chủ khi truy xuất biến thể sản phẩm từ Backend",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
