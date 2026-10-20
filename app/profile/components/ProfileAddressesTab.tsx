"use client";

import React, { useState } from "react";
import { Plus, MapPin, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { UserAddress, UserResponse } from "@/types/auth.type";
import { AddressFormData } from "@/lib/schemas/profile.schema";
import ProfileAddressModal from "./ProfileAddressModal";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/queries";

interface ProfileAddressesTabProps {
  user: UserResponse;
  showToast: (message: string, type?: "success" | "error") => void;
}

export default function ProfileAddressesTab({ user, showToast }: ProfileAddressesTabProps) {
  const { data: addresses = [], isLoading: isAddressesLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (formData: AddressFormData, id: string | null) => {
    try {
      if (id) {
        await updateAddressMutation.mutateAsync({
          id,
          body: formData,
        });
        showToast("Cập nhật địa chỉ nhận hàng thành công!");
      } else {
        await createAddressMutation.mutateAsync(formData);
        showToast("Thêm địa chỉ giao hàng mới thành công!");
      }
      setAddressModalOpen(false);
      setEditingAddress(null);
    } catch {
      showToast("Không thể lưu địa chỉ. Vui lòng thử lại.", "error");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(id);
      showToast("Đã đặt làm địa chỉ giao hàng mặc định!");
    } catch {
      showToast("Không thể đặt làm mặc định. Vui lòng thử lại.", "error");
    }
  };

  const confirmDeleteAddress = async () => {
    if (!deletingAddressId) return;
    try {
      await deleteAddressMutation.mutateAsync(deletingAddressId);
      showToast("Đã xóa địa chỉ thành công!");
    } catch {
      showToast("Không thể xóa địa chỉ. Vui lòng thử lại.", "error");
    } finally {
      setDeletingAddressId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
        <div>
          <h2 className="text-xl font-extrabold font-heading text-foreground">
            Sổ Địa Chỉ Giao Hàng
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Lưu sẵn thông tin giao hàng giúp bạn thanh toán và đặt hàng nhanh chóng
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={openAddAddressModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Thêm Địa Chỉ Mới
        </Button>
      </div>

      {/* Addresses List */}
      {isAddressesLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border bg-card animate-pulse space-y-3"
            >
              <div className="h-4 bg-secondary rounded w-1/3" />
              <div className="h-3 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40 text-primary" />
          <p className="text-sm font-semibold">Chưa có địa chỉ giao hàng nào</p>
          <p className="text-xs mt-1">
            Nhấp vào nút bên trên để thêm địa chỉ đầu tiên của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all ${
                addr.isDefault
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {addr.recipientName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({addr.phoneNumber})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                      {addr.label || "Nhà Riêng"}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-white">
                        Mặc Định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                    {addr.detailedAddress}
                    {addr.ward ? `, ${addr.ward}` : ""}, {addr.district}, {addr.province}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-xs font-semibold text-primary hover:underline px-2 py-1 cursor-pointer"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditAddressModal(addr)}
                    className="w-8 h-8 rounded-lg border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-colors cursor-pointer"
                    title="Chỉnh sửa địa chỉ"
                    aria-label="Chỉnh sửa địa chỉ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingAddressId(addr.id)}
                    className="w-8 h-8 rounded-lg border border-border bg-secondary hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
                    title="Xóa địa chỉ"
                    aria-label="Xóa địa chỉ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <ProfileAddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        editingAddress={editingAddress}
        defaultRecipientName={user.fullName || ""}
        defaultPhone={user.phone || user.phoneNumber || ""}
        isFirstAddress={addresses.length === 0}
        onSave={handleSaveAddress}
        isLoading={createAddressMutation.isPending || updateAddressMutation.isPending}
      />

      {/* Confirm Delete Address Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingAddressId)}
        title="Xóa Địa Chỉ Giao Hàng"
        message="Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ không? Thao tác này không thể hoàn tác."
        confirmText="Xóa Địa Chỉ"
        cancelText="Giữ Lại"
        variant="danger"
        isLoading={deleteAddressMutation.isPending}
        onConfirm={confirmDeleteAddress}
        onClose={() => setDeletingAddressId(null)}
      />
    </div>
  );
}
