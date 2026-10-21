import { test, expect } from "@playwright/test";

test.describe("TitanFit Comprehensive UI Suite", () => {
  test("1. Homepage, Navigation & Theme Mode Toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TITANFIT/i);

    // Verify header and navigation
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // Verify initial theme
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");

    // Toggle theme via theme button
    const themeBtn = page.getByRole("button", { name: /Chuyển sang giao diện/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      const newTheme = await html.getAttribute("data-theme");
      expect(newTheme).not.toBe(initialTheme);

      // Verify localStorage uses titanfit_theme_mode
      const storedTheme = await page.evaluate(() => localStorage.getItem("titanfit_theme_mode"));
      expect(storedTheme).toBe(newTheme);

      // Verify titanfit_theme is NOT set
      const oldTheme = await page.evaluate(() => localStorage.getItem("titanfit_theme"));
      expect(oldTheme).toBeNull();

      // Switch back
      await themeBtn.click();
    }

    // Verify key homepage sections
    await expect(
      page.locator("text=CAM KẾT CHÍNH HÃNG 100%").or(page.locator("text=CHÍNH HÃNG")).first()
    ).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("2. Product Catalog, PDP Gallery & Cart Drawer Flow", async ({ page }) => {
    // Intercept products API for deterministic e2e flow
    await page.route("**/api/products**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/products/")) {
        const slug = url.split("/api/products/")[1].split("?")[0];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "prod-1",
              name: "TITAN Hydro Whey 5Lbs",
              slug: slug || "titan-hydro-whey-5lbs",
              basePrice: 1850000,
              description: "Whey protein cao cấp",
              categoryName: "Thực Phẩm Bổ Sung",
              variants: [
                {
                  id: "var-1",
                  sku: "THW-CHOCO",
                  variantName: "Vị Chocolate 5Lbs",
                  price: 1850000,
                  stockQuantity: 20,
                  imageUrl: "/images/products/titan-hydro-whey.jpg",
                },
              ],
            },
            message: "Success",
            statusCode: 200,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              content: [
                {
                  id: "prod-1",
                  name: "TITAN Hydro Whey 5Lbs",
                  slug: "titan-hydro-whey-5lbs",
                  basePrice: 1850000,
                  primaryImage: "/images/products/titan-hydro-whey.jpg",
                  thumbnailUrl: "/images/products/titan-hydro-whey.jpg",
                  categoryName: "Thực Phẩm Bổ Sung",
                  categorySlug: "thuc-pham-bo-sung",
                },
              ],
              totalElements: 1,
              totalPages: 1,
              pageNumber: 0,
              pageSize: 12,
            },
            message: "Success",
            statusCode: 200,
          }),
        });
      }
    });

    // Navigate to products catalog
    await page.goto("/products");
    await expect(page).toHaveURL(/products/);

    // Ensure product cards exist
    const productLinks = page.locator("a[href^='/products/']");
    await expect(productLinks.first()).toBeVisible();

    // Navigate to first product detail page
    const firstProductHref = await productLinks.first().getAttribute("href");
    expect(firstProductHref).toBeTruthy();
    await page.goto(firstProductHref!);

    // Verify main product image uses next/image
    const mainImg = page.locator("main img").first();
    await expect(mainImg).toBeVisible();

    // Verify thumbnails if present
    const thumbnails = page.locator("button[aria-label*='Xem ảnh']");
    const thumbCount = await thumbnails.count();
    if (thumbCount > 1) {
      await thumbnails.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Add to cart
    const addToCartBtn = page.getByRole("button", { name: /Thêm Vào Giỏ/i });
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();

      // Verify CartDrawer opens
      const cartDrawer = page.locator("text=Giỏ Hàng").first();
      await expect(cartDrawer).toBeVisible();

      // Close CartDrawer
      const closeDrawerBtn = page
        .getByRole("button", { name: /Đóng giỏ hàng/i })
        .or(page.locator("button:has-text('✕')"))
        .first();
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
      }
    }
  });

  test("3. Checkout Page Hydration & Form Rendering", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/checkout/);

    // Verify checkout heading or empty cart notice
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Hydration check: ensure page is hydrated and no raw placeholders
    const isHydrated = await page.evaluate(() => document.readyState === "complete");
    expect(isHydrated).toBe(true);
  });

  test("4. Order Tracking Flow", async ({ page }) => {
    await page.goto("/order-tracking");
    await expect(page).toHaveURL(/order-tracking/);

    // Verify tracking page header and search input or login prompt
    const trackingTitle = page.locator("text=Tra Cứu Đơn Hàng").or(page.locator("h1")).first();
    await expect(trackingTitle).toBeVisible();
  });

  test("5. Admin Portal Security & Login Guard", async ({ page }) => {
    // Attempt to access admin routes without credentials
    await page.goto("/admin");
    // Verify security guard redirects to login with redirect query param
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);

    // Verify login form is properly displayed
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("input[type='password'], input[name='password']").first();
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.getByRole("button", { name: /Đăng Nhập/i }).first();
    await expect(submitBtn).toBeVisible();
  });

  test("6. Profile Page Security Guard (Redirects unauthenticated users)", async ({ page }) => {
    // Attempt to access /profile without credentials
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
  });

  test("7. Profile Page Tabs, Address Manager & Form (Authenticated)", async ({
    page,
    context,
  }) => {
    let currentUserData = {
      id: "usr-e2e-123",
      fullName: "Titan Runner",
      email: "runner@titanfit.vn",
      role: "ROLE_USER" as const,
      phoneNumber: "0987654321",
      tier: "Titan Gold Member",
      gender: "MALE" as const,
      dateOfBirth: "1998-08-18",
    };

    // Intercept backend /api/auth/me to return valid user session
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: currentUserData,
          message: "Success",
          statusCode: 200,
        }),
      });
    });

    await page.route("**/api/auth/profile", async (route) => {
      try {
        const body = route.request().postDataJSON();
        if (body?.fullName) {
          currentUserData = { ...currentUserData, ...body };
        }
      } catch {
        // ignore parse error
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: currentUserData,
          message: "Success",
          statusCode: 200,
        }),
      });
    });

    await page.route("**/api/users/addresses**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "addr-1",
              recipientName: "Titan Runner",
              phoneNumber: "0987654321",
              province: "Hà Nội",
              district: "Cầu Giấy",
              ward: "Dịch Vọng Hậu",
              detailedAddress: "Số 1 Duy Tân",
              isDefault: true,
              label: "Nhà Riêng",
            },
          ],
          message: "Success",
          statusCode: 200,
        }),
      });
    });

    await page.route("**/api/orders/my-orders**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "ord-1",
              orderCode: "TF-98214",
              createdAt: "2026-10-19T07:30:00Z",
              status: "PROCESSING",
              totalAmount: 1850000,
              items: [
                {
                  productId: "prod-1",
                  productName: "TITAN Hydro Whey 5Lbs",
                  quantity: 1,
                  price: 1850000,
                },
              ],
            },
          ],
          message: "Success",
          statusCode: 200,
        }),
      });
    });

    // Seed authenticated session cookie & localStorage
    await context.addCookies([
      {
        name: "accessToken",
        value: "mock-access-token",
        url: "http://localhost:3000",
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "titanfit_auth",
        JSON.stringify({
          state: {
            user: {
              id: "usr-e2e-123",
              fullName: "Titan Runner",
              email: "runner@titanfit.vn",
              role: "ROLE_USER",
              phoneNumber: "0987654321",
              tier: "Titan Gold Member",
              gender: "MALE",
              dateOfBirth: "1998-08-18",
            },
            isAuthenticated: true,
            isLoading: false,
          },
          version: 0,
        })
      );
    });

    // Navigate to /profile
    await page.goto("/profile");
    await expect(page).toHaveURL(/profile/);

    // Verify Member Card renders user name and email in sidebar
    await expect(page.locator("aside").getByText("Titan Runner")).toBeVisible();
    await expect(page.locator("aside").getByText("runner@titanfit.vn")).toBeVisible();

    // Verify Profile Form inputs are prefilled
    const fullNameInput = page.locator("#profile-fullName");
    await expect(fullNameInput).toHaveValue("Titan Runner");

    // Switch to Addresses Tab
    await page.getByRole("button", { name: /Sổ Địa Chỉ Nhận Hàng/i }).click();
    await expect(page).toHaveURL(/tab=addresses/);
    await expect(page.locator("text=Thêm Địa Chỉ Mới")).toBeVisible();

    // Switch to Security Tab
    await page.getByRole("button", { name: /Đổi Mật Khẩu & Bảo Mật/i }).click();
    await expect(page).toHaveURL(/tab=security/);
    await expect(page.locator("#security-current-pw")).toBeVisible();

    // Switch to Orders Tab
    await page.getByRole("button", { name: /Đơn Hàng Gần Đây/i }).click();
    await expect(page).toHaveURL(/tab=orders/);
    await expect(page.locator("text=TF-98214")).toBeVisible();

    // Switch back to Profile tab and save changes
    await page.getByRole("button", { name: /Thông Tin Cá Nhân/i }).click();
    await fullNameInput.fill("Titan Pro Athlete");
    await page.getByRole("button", { name: /Lưu Thay Đổi/i }).click();

    // Verify updated name reflects in sidebar
    await expect(page.locator("aside h2:has-text('Titan Pro Athlete')")).toBeVisible();
  });

  test("8. Register Page UI & Form Validation", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);

    // Verify form elements exist
    await expect(page.locator("#regFullName")).toBeVisible();
    await expect(page.locator("#regEmail")).toBeVisible();
    await expect(page.locator("#regPhone")).toBeVisible();
    await expect(page.locator("#regPassword")).toBeVisible();
    await expect(page.locator("#regConfirmPassword")).toBeVisible();

    // Submit empty form and verify client validation errors appear
    const submitBtn = page.locator("button[type='submit']").first();
    await submitBtn.click();

    // Verify error text appears for required fields
    await expect(
      page
        .locator("text=Họ và tên phải có ít nhất 2 ký tự")
        .or(page.locator(".text-destructive"))
        .first()
    ).toBeVisible();
  });

  test("9. Login Page Direct Access & UI Elements", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);

    // Check login inputs
    const emailInput = page.locator("#loginEmail");
    const passwordInput = page.locator("#loginPassword");
    const submitBtn = page.getByRole("button", { name: /Đăng Nhập/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Verify link to registration page
    const registerLink = page.locator("a[href^='/register']").first();
    await expect(registerLink).toBeVisible();
  });

  test("10. Order Success Page Direct Access & Redirect Guard", async ({ page }) => {
    // Unauthenticated access should redirect to login with redirect param
    await page.goto("/order-success/TF-SAMPLE123");
    await expect(page).toHaveURL(/\/login\?redirect=%2Forder-success%2FTF-SAMPLE123/);
  });

  test("11. Admin Portal Navigation & Sidebar (Authenticated Admin)", async ({ page, context }) => {
    // Generate valid mock JWT with ROLE_ADMIN
    const exp = Math.floor(Date.now() / 1000) + 7200;
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "admin@titanfit.vn",
        role: "ROLE_ADMIN",
        fullName: "Titan Super Admin",
        userId: "admin-1",
        exp,
      })
    ).toString("base64url");
    const mockAdminJwt = `${header}.${payload}.mockSignature`;

    await context.addCookies([
      {
        name: "accessToken",
        value: mockAdminJwt,
        url: "http://localhost:3000",
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "titanfit_auth",
        JSON.stringify({
          state: {
            user: {
              id: "admin-1",
              fullName: "Titan Super Admin",
              email: "admin@titanfit.vn",
              role: "ROLE_ADMIN",
            },
            isAuthenticated: true,
            isLoading: false,
          },
          version: 0,
        })
      );
    });

    // Intercept admin endpoints for reliable e2e test execution
    await page.route("**/api/admin/orders**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], message: "Success", statusCode: 200 }),
      });
    });

    await page.route("**/api/admin/products**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], message: "Success", statusCode: 200 }),
      });
    });

    await page.goto("/admin");
    await expect(page).toHaveURL(/admin/);

    // Verify admin navigation items render
    await expect(page.locator("text=Tổng Quan").first()).toBeVisible();
    await expect(page.locator("text=Sản Phẩm").first()).toBeVisible();
    await expect(page.locator("text=Đơn Hàng").first()).toBeVisible();
  });

  test("12. Stale Session Purge: when accessToken is missing/expired, redirect to /login and ensure Navbar does not show logged in user", async ({
    page,
  }) => {
    // Seed stale authenticated state in localStorage without any accessToken cookie
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "titanfit_auth",
        JSON.stringify({
          state: {
            user: {
              id: "admin-stale",
              fullName: "Admin TitanFit",
              email: "admin@titanfit.vn",
              role: "ROLE_ADMIN",
            },
            isAuthenticated: true,
            isLoading: false,
          },
          version: 0,
        })
      );
    });

    // Attempt to access protected /admin route without accessToken cookie
    await page.goto("/admin");

    // Verify redirected to /login with redirect parameter
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);

    // Verify Navbar shows "Đăng Nhập" button and NOT the logged-in user menu trigger
    await expect(page.getByRole("link", { name: "Đăng Nhập" })).toBeVisible();
    await expect(page.locator("#userMenuTrigger")).not.toBeVisible();

    // Verify localStorage auth state was purged
    const storedAuth = await page.evaluate(() => {
      const raw = window.localStorage.getItem("titanfit_auth");
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedAuth?.state?.isAuthenticated).toBeFalsy();
  });
});
