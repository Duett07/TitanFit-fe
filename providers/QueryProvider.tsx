"use client";

import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useAutoSync, SyncMessage } from "@/lib/sync";
import { queryKeys } from "@/hooks/queries/queryKeys";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true, // Auto refetch when tab becomes active
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse existing query client to avoid recreating across suspense
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

/**
 * SyncBridge: Bridges the browser tab's cross-tab sync hub with TanStack Query.
 * When any tab emits an event (ORDER_UPDATED, PRODUCT_UPDATED, INVENTORY_UPDATED),
 * this automatically invalidates matching queries in the cache.
 */
function SyncQueryBridge() {
  const queryClient = useQueryClient();

  useAutoSync({
    onSync: (message?: SyncMessage) => {
      if (!message || !message.type) {
        queryClient.invalidateQueries();
        return;
      }

      switch (message.type) {
        case "ORDER_UPDATED":
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
          break;
        case "PRODUCT_UPDATED":
          queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          break;
        case "INVENTORY_UPDATED":
          queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
          break;
        default:
          queryClient.invalidateQueries();
          break;
      }
    },
    // We rely on TanStack Query's native refetchOnWindowFocus
    enableFocusSync: false,
  });

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SyncQueryBridge />
      {children}
    </QueryClientProvider>
  );
}
