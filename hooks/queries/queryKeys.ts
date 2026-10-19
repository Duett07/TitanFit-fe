export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    adminList: () => [...queryKeys.products.all, "admin"] as const,
  },
  orders: {
    all: ["orders"] as const,
    myOrders: () => [...queryKeys.orders.all, "my-orders"] as const,
    detail: (code: string) => [...queryKeys.orders.all, "detail", code] as const,
    adminList: () => [...queryKeys.orders.all, "admin"] as const,
  },
  inventory: {
    all: ["inventory"] as const,
  },
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
};
