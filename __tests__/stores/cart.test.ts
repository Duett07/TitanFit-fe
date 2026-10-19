import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/stores/useCartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    // Provide in-memory storage mock for zustand persist middleware
    const storageMock = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => storageMock.get(key) || null,
      setItem: (key: string, value: string) => storageMock.set(key, value),
      removeItem: (key: string) => storageMock.delete(key),
      clear: () => storageMock.clear(),
      length: 0,
      key: () => null,
    };

    // Reset store state before each test
    useCartStore.setState({
      items: [],
      isDrawerOpen: false,
      isSyncing: false,
      syncNotice: null,
    });
  });

  it("initializes with an empty cart", () => {
    const { items, getTotalCount, getTotalPrice } = useCartStore.getState();
    expect(items).toEqual([]);
    expect(getTotalCount()).toBe(0);
    expect(getTotalPrice()).toBe(0);
  });

  it("adds an item to cart and bounds initial quantity to stock", () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        productId: "prod-1",
        variantId: "var-1",
        slug: "whey-gold",
        name: "Whey Gold Standard",
        image: "/whey.jpg",
        price: 900000,
        selectedVariants: { "Hương Vị": "Chocolate" },
        variantSummary: "Chocolate • 5 Lbs",
        stock: 5,
      },
      2
    );

    const { items, getTotalCount, getTotalPrice } = useCartStore.getState();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe("var-1");
    expect(items[0].quantity).toBe(2);
    expect(getTotalCount()).toBe(2);
    expect(getTotalPrice()).toBe(1800000);
  });

  it("caps added quantity if it exceeds available stock", () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        productId: "prod-2",
        variantId: "var-2",
        slug: "creatine",
        name: "Creatine Monohydrate",
        image: "/creatine.jpg",
        price: 500000,
        selectedVariants: { "Quy cách": "300g" },
        variantSummary: "300g",
        stock: 3,
      },
      10 // Requesting 10 while only 3 in stock
    );

    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(3); // Capped at stock
  });

  it("accumulates quantity when adding the same variant multiple times", () => {
    const { addItem } = useCartStore.getState();

    const product = {
      productId: "prod-3",
      variantId: "var-3",
      slug: "bcaa",
      name: "BCAA Powder",
      image: "/bcaa.jpg",
      price: 400000,
      selectedVariants: { "Hương Vị": "Dưa hấu" },
      variantSummary: "Dưa hấu",
      stock: 10,
    };

    addItem(product, 2);
    addItem(product, 3);

    const { items, getTotalCount } = useCartStore.getState();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
    expect(getTotalCount()).toBe(5);
  });

  it("updates item quantity and clamps to stock", () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem(
      {
        productId: "prod-4",
        variantId: "var-4",
        slug: "pre-workout",
        name: "Pre Workout",
        image: "/pre.jpg",
        price: 600000,
        selectedVariants: { "Hương Vị": "Cam" },
        variantSummary: "Cam",
        stock: 4,
      },
      1
    );

    updateQuantity("var-4", 10); // exceed stock
    expect(useCartStore.getState().items[0].quantity).toBe(4);

    updateQuantity("var-4", 2);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item when quantity is updated to 0 or less", () => {
    const { addItem, updateQuantity } = useCartStore.getState();

    addItem(
      {
        productId: "prod-5",
        variantId: "var-5",
        slug: "vitamin",
        name: "Daily Vitamin",
        image: "/vitamin.jpg",
        price: 300000,
        selectedVariants: {},
        variantSummary: "Hộp 60 viên",
        stock: 10,
      },
      2
    );

    updateQuantity("var-5", 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("removes item by ID and clears cart completely", () => {
    const { addItem, removeItem, clearCart } = useCartStore.getState();

    addItem({
      productId: "1",
      variantId: "v-1",
      slug: "p1",
      name: "Product 1",
      image: "/p1.jpg",
      price: 100000,
      selectedVariants: {},
      variantSummary: "Standard",
      stock: 5,
    });

    addItem({
      productId: "2",
      variantId: "v-2",
      slug: "p2",
      name: "Product 2",
      image: "/p2.jpg",
      price: 200000,
      selectedVariants: {},
      variantSummary: "Standard",
      stock: 5,
    });

    expect(useCartStore.getState().items.length).toBe(2);

    removeItem("v-1");
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].id).toBe("v-2");

    clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
  });
});
