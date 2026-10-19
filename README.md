# TITANFIT — Frontend Web Application

> Giao diện website thương mại điện tử chuyên nghiệp cung cấp đồ thể thao & thực phẩm bổ sung dinh dưỡng thể hình cao cấp.

---

## Tổng Quan Dự Án

**TitanFit Frontend** được xây dựng trên nền tảng **Next.js 16 (App Router)** và **React 19**, mang lại trải nghiệm mua sắm mượt mà, tốc độ tải trang tối ưu và giao diện hiện đại chuẩn thẩm mỹ thể thao mạnh mẽ.

Dự án tích hợp trực tiếp với hệ thống **Backend TitanFit (Spring Boot API)** phục vụ đầy đủ luồng nghiệp vụ từ duyệt sản phẩm, lọc/tìm kiếm, giỏ hàng, thanh toán đến quản lý đơn hàng và trang quản trị Admin.

---

## Công Nghệ Sử Dụng (Tech Stack)

| Thành phần         | Công nghệ                                                             | Phiên bản / Chi tiết                                                               |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Core Framework** | [Next.js](https://nextjs.org/)                                        | 16 (App Router)                                                                    |
| **UI Library**     | [React](https://react.dev/)                                           | 19                                                                                 |
| **Language**       | [TypeScript](https://www.typescriptlang.org/)                         | v5                                                                                 |
| **Styling**        | [Tailwind CSS](https://tailwindcss.com/)                              | v4                                                                                 |
| **Icons**          | [Lucide React](https://lucide.dev/)                                   | Icon SVG hiện đại                                                                  |
| **Typography**     | `next/font/google`                                                    | **Outfit** (Tiêu đề/Display) & **Plus Jakarta Sans** (Nội dung, hỗ trợ tiếng Việt) |
| **Server State**   | [@tanstack/react-query](https://tanstack.com/query)                   | v5 (Cache & đồng bộ dữ liệu server)                                                |
| **Client State**   | [Zustand](https://zustand-demo.pmnd.rs/)                              | v5 (Quản lý giỏ hàng & state client)                                               |
| **HTTP Client**    | [Axios](https://axios-http.com/)                                      | Quản lý request, interceptors xử lý token                                          |
| **Validation**     | [Zod](https://zod.dev/)                                               | Schema validation cho Form & Env                                                   |
| **Testing**        | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Unit Test & End-to-End Testing                                                     |
| **Code Quality**   | ESLint 9 & Prettier                                                   | Chuẩn hoá cú pháp và format mã nguồn                                               |

---

## Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản 20.x trở lên (khuyên dùng Node LTS)
- **Trình quản lý gói**: `npm` (hoặc `pnpm`, `yarn`)
- **Backend API**: Dịch vụ TitanFit Backend (Spring Boot) đang chạy tại cổng mặc định `http://localhost:8080`

---

## Cấu Hình Môi Trường (Environment Setup)

Tạo file `.env.local` từ file mẫu `.env.example`:

```bash
cp .env.example .env.local
```

### Biến môi trường:

| Tên biến                   | Bắt buộc | Mặc định                | Mô tả                                  |
| -------------------------- | :------: | ----------------------- | -------------------------------------- |
| `NEXT_PUBLIC_API_ENDPOINT` |    Có    | `http://localhost:8080` | URL gốc của Backend Spring Boot server |

> **Lưu ý:** Biến này được validate tự động bởi [Zod](config.ts) trong [fe/config.ts](config.ts). Khi chạy môi trường production, ứng dụng yêu cầu URL hợp lệ và không được để trống.

---

## Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt các gói phụ thuộc:

```bash
npm install
```

### 2. Khởi chạy máy chủ phát triển (Dev server):

```bash
npm run dev
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

### 3. Build mã nguồn Production:

```bash
npm run build
npm run start
```

---

## Kiểm Thử & Kiểm Soát Chất Lượng Code

Dự án đã tích hợp đầy đủ công cụ kiểm thử tự động và định dạng mã nguồn:

```bash
# Chạy Unit Tests với Vitest
npm run test

# Chạy Unit Tests ở chế độ theo dõi file (watch mode)
npm run test:watch

# Chạy kiểm thử luồng người dùng End-to-End (Playwright)
npm run test:e2e

# Kiểm tra lỗi lint với ESLint
npm run lint

# Format toàn bộ source code với Prettier
npm run format

# Kiểm tra định dạng code mà không ghi đè
npm run format:check
```

---

## Cấu Trúc Thư Mục (Project Structure)

```text
fe/
├── app/                      # Next.js App Router (Pages, Layouts & Route Handlers)
│   ├── layout.tsx            # Root layout: nạp fonts (Outfit, Plus Jakarta Sans), Providers
│   ├── page.tsx              # Trang chủ: Banner, Sản phẩm nổi bật, Khuyến mãi
│   ├── catalog/              # Danh mục sản phẩm (bộ lọc, phân trang, sắp xếp)
│   ├── products/[id]/        # Chi tiết sản phẩm, chọn biến thể hương vị/size, kho hàng
│   ├── checkout/             # Giỏ hàng, thông tin giao hàng & chọn phương thức thanh toán
│   ├── order-success/        # Xác nhận đơn hàng thành công
│   ├── order-tracking/       # Tra cứu trạng thái đơn hàng theo mã & SĐT
│   ├── (auth)/               # Đăng nhập & Đăng ký tài khoản
│   └── admin/                # Trang quản trị: thống kê, đơn hàng, danh mục & sản phẩm
├── components/               # UI components dùng chung (Navbar, Footer, CartDrawer, Cards...)
├── stores/                   # Quản lý state toàn cục với Zustand (cartStore, authStore...)
├── lib/                      # Cấu hình http.ts (Axios instance), Zod schemas, helper functions
├── providers/                # React Context Providers (QueryProvider,...)
├── apiRequest/               # Các hàm gọi API chia theo module (auth, products, orders...)
├── types/                    # Khai báo TypeScript types & interfaces
├── config.ts                 # Validate biến môi trường bằng Zod
├── __tests__/                # Thư mục chứa Unit Tests (Vitest)
└── e2e/                      # Thư mục chứa E2E Tests (Playwright)
```

---

## Liên Kết Với TitanFit Backend

Frontend giao tiếp với Spring Boot Backend qua RESTful API tiêu chuẩn:

- **Authentication**: JWT Bearer token / Cookie xác thực phiên làm việc.
- **Product & Catalog**: Quản lý biến thể (variants), phân loại đồ tập (Apparel) & thực phẩm bổ sung (Supplements).
- **Orders & Checkout**: Xử lý tạo đơn hàng, hỗ trợ thanh toán khi nhận hàng (COD) và cổng thanh toán VNPay.
- **Global Error Handling**: Tự động hiển thị phản hồi lỗi thân thiện với người dùng thông qua Axios interceptor.
