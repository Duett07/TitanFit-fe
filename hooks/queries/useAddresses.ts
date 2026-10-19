"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import authApiRequest from "@/apiRequest/auth";
import { queryKeys } from "./queryKeys";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserAddress, CreateAddressRequest, UpdateAddressRequest } from "@/types/auth.type";

export function useAddresses() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.addresses.list(),
    queryFn: async (): Promise<UserAddress[]> => {
      try {
        const res = await authApiRequest.getAddresses();
        const data = res.data?.data;
        if (Array.isArray(data)) {
          return data;
        }
      } catch (error) {
        console.warn("Failed to fetch addresses from backend, using store fallback:", error);
      }
      return user?.addresses && user.addresses.length > 0 ? user.addresses : [];
    },
    initialData: user?.addresses || [],
    staleTime: 60 * 1000,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (body: CreateAddressRequest): Promise<UserAddress> => {
      try {
        const res = await authApiRequest.createAddress(body);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn("Backend address creation fallback to local state:", err);
      }
      // Fallback local ID generation if backend is offline
      const newAddress: UserAddress = {
        ...body,
        id: `addr-${Date.now()}`,
      };
      return newAddress;
    },
    onSuccess: (newAddress) => {
      queryClient.setQueryData<UserAddress[]>(queryKeys.addresses.list(), (old = []) => {
        let updatedList = [...old];
        if (newAddress.isDefault) {
          updatedList = updatedList.map((addr) => ({ ...addr, isDefault: false }));
        }
        return [...updatedList, newAddress];
      });

      // Synchronize with auth store
      const currentAddrs = user?.addresses || [];
      let updatedAddrs = [...currentAddrs];
      if (newAddress.isDefault) {
        updatedAddrs = updatedAddrs.map((addr) => ({ ...addr, isDefault: false }));
      }
      updateUser({ addresses: [...updatedAddrs, newAddress] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateAddressRequest;
    }): Promise<UserAddress> => {
      try {
        const res = await authApiRequest.updateAddress(id, body);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn("Backend address update fallback to local state:", err);
      }
      const existing = (user?.addresses || []).find((a) => a.id === id);
      return {
        id,
        recipientName: body.recipientName ?? existing?.recipientName ?? "",
        phoneNumber: body.phoneNumber ?? existing?.phoneNumber ?? "",
        province: body.province ?? existing?.province ?? "",
        district: body.district ?? existing?.district ?? "",
        ward: body.ward ?? existing?.ward ?? "",
        detailedAddress: body.detailedAddress ?? existing?.detailedAddress ?? "",
        isDefault: body.isDefault ?? existing?.isDefault ?? false,
        label: body.label ?? existing?.label ?? "Nhà Riêng",
      };
    },
    onSuccess: (updatedAddress) => {
      queryClient.setQueryData<UserAddress[]>(queryKeys.addresses.list(), (old = []) => {
        let list = old.map((item) => (item.id === updatedAddress.id ? updatedAddress : item));
        if (updatedAddress.isDefault) {
          list = list.map((item) =>
            item.id === updatedAddress.id ? item : { ...item, isDefault: false }
          );
        }
        return list;
      });

      const current = user?.addresses || [];
      let list = current.map((item) => (item.id === updatedAddress.id ? updatedAddress : item));
      if (updatedAddress.isDefault) {
        list = list.map((item) =>
          item.id === updatedAddress.id ? item : { ...item, isDefault: false }
        );
      }
      updateUser({ addresses: list });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await authApiRequest.deleteAddress(id);
      } catch (err) {
        console.warn("Backend address delete fallback:", err);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<UserAddress[]>(queryKeys.addresses.list(), (old = []) =>
        old.filter((a) => a.id !== deletedId)
      );

      const current = user?.addresses || [];
      updateUser({ addresses: current.filter((a) => a.id !== deletedId) });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await authApiRequest.setDefaultAddress(id);
      } catch (err) {
        console.warn("Backend set default address fallback:", err);
      }
      return id;
    },
    onSuccess: (defaultId) => {
      queryClient.setQueryData<UserAddress[]>(queryKeys.addresses.list(), (old = []) =>
        old.map((addr) => ({
          ...addr,
          isDefault: addr.id === defaultId,
        }))
      );

      const current = user?.addresses || [];
      updateUser({
        addresses: current.map((addr) => ({
          ...addr,
          isDefault: addr.id === defaultId,
        })),
      });
    },
  });
}
