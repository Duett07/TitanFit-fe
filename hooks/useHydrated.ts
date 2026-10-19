"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hook to determine if the component has finished hydrating on the client.
 * Uses `useSyncExternalStore` with a client snapshot returning `true` and a server snapshot returning `false`.
 * This avoids SSR hydration mismatches without triggering extra cascading re-renders.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default useHydrated;
