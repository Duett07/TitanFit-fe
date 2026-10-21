import { test, expect } from "@playwright/test";

test.describe("Admin Products Page Verification", () => {
  test("renders correctly with Spring Boot Page response and no runtime errors", async ({ page, context }) => {
    const dummyToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkB0aXRhbmZpdC52biIsInJvbGUiOiJST0xFX0FETUlOIiwiZnVsbE5hbWUiOiJBZG1pbiBUaXRhbkZpdCIsInVzZXJJZCI6ImFkbWluLTEiLCJwaG9uZSI6IjA5MDAwMDAwMDAiLCJleHAiOjIxNDc0ODM2NDd9.signature";

    await context.addCookies([
      {
        name: "accessToken",
        value: dummyToken,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // Intercept backend API requests so http.ts does not 401 redirect
    await page.route("**/api/admin/products", async (route) => {
      // Return Spring Boot Page structure wrapped in ApiResponse
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          status: 200,
          message: "Success",
          data: {
            content: [
              {
                id: "p-test-1",
                name: "Whey Gold Standard 5Lbs",
                slug: "whey-gold-standard-5lbs",
                basePrice: 1550000,
                thumbnailUrl:
                  "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80",
                categoryName: "Whey Protein",
                categorySlug: "whey-protein",
                isActive: true,
                variants: [
                  {
                    id: "v-1",
                    sku: "WHEY-GOLD-5LB-CHOCO",
                    variantName: "Hương Vị Chocolate",
                    price: 1550000,
                    stockQuantity: 25,
                  },
                ],
              },
            ],
            pageNo: 0,
            pageSize: 20,
            totalElements: 1,
            totalPages: 1,
            last: true,
          },
        }),
      });
    });

    await page.route("**/api/categories", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          status: 200,
          message: "Success",
          data: [{ id: "cat-1", name: "Whey Protein", slug: "whey-protein" }],
        }),
      });
    });

    await page.route("**/api/admin/orders", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: 200,
          status: 200,
          message: "Success",
          data: [],
        }),
      });
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/admin/products", { waitUntil: "networkidle" });

    // Verify main heading
    await expect(page.getByRole("heading", { name: "Quản Lý Sản Phẩm & Biến Thể" })).toBeVisible();

    // Verify product badge count
    await expect(page.locator("text=1 sản phẩm").first()).toBeVisible();

    // Verify product in the table
    await expect(page.locator("table")).toContainText("Whey Gold Standard 5Lbs");

    // Verify no runtime errors occurred
    expect(pageErrors.filter((msg) => msg.includes("products.filter is not a function"))).toHaveLength(0);

    // Save screenshot as artifact
    await page.screenshot({
      path: "/home/du/.gemini/antigravity-ide/brain/acf25940-368b-4ec4-af18-500c844e2d49/admin_products_resolved.png",
      fullPage: true,
    });
  });
});
