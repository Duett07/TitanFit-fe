import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tất Cả Sản Phẩm — TITANFIT Chính Hãng",
  description:
    "Danh mục trang phục thể thao dry-fit, phụ kiện tập gym và thực phẩm bổ sung dinh dưỡng thể hình cao cấp chính hãng tại TITANFIT.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
