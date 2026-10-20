"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addressSchema, AddressFormData } from "@/lib/schemas/profile.schema";
import { UserAddress } from "@/types/auth.type";

interface ProfileAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAddress: UserAddress | null;
  defaultRecipientName: string;
  defaultPhone: string;
  isFirstAddress: boolean;
  onSave: (data: AddressFormData, id: string | null) => Promise<void>;
  isLoading: boolean;
}

interface AddressFormContentProps {
  initialData: AddressFormData;
  editingId: string | null;
  onClose: () => void;
  onSave: (data: AddressFormData, id: string | null) => Promise<void>;
  isLoading: boolean;
}

function AddressFormContent({
  initialData,
  editingId,
  onClose,
  onSave,
  isLoading,
}: AddressFormContentProps) {
  const [formData, setFormData] = useState<AddressFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = addressSchema.safeParse(formData);
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(errMap);
      return;
    }

    await onSave(formData, editingId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Tên Người Nhận"
          value={formData.recipientName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, recipientName: e.target.value }))
          }
          error={errors.recipientName}
          placeholder="VD: Nguyễn Văn A"
          required
        />
        <Input
          label="Số Điện Thoại"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
          }
          error={errors.phoneNumber}
          placeholder="VD: 0912345678"
          required
        />
        <Input
          label="Tỉnh / Thành Phố"
          value={formData.province}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, province: e.target.value }))
          }
          error={errors.province}
          placeholder="VD: Hà Nội"
          required
        />
        <Input
          label="Quận / Huyện"
          value={formData.district}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, district: e.target.value }))
          }
          error={errors.district}
          placeholder="VD: Quận Cầu Giấy"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phường / Xã"
          value={formData.ward || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, ward: e.target.value }))}
          placeholder="VD: Phường Dịch Vọng Hậu"
        />
        <div>
          <label className="text-xs font-semibold text-foreground/90 block mb-1.5">
            Nhãn Địa Chỉ
          </label>
          <div className="flex gap-2">
            {(["Nhà Riêng", "Văn Phòng", "Khác"] as const).map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, label: lbl }))}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  formData.label === lbl
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/60 text-foreground"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Input
        label="Địa Chỉ Chi Tiết (Số nhà, tên đường, tòa nhà)"
        value={formData.detailedAddress}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, detailedAddress: e.target.value }))
        }
        error={errors.detailedAddress}
        placeholder="VD: Số 18, Ngõ 45 Phố Duy Tân"
        required
      />

      <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={formData.isDefault}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
          }
          className="rounded border-border text-primary focus:ring-primary accent-primary w-4 h-4"
        />
        <span className="text-xs font-semibold text-foreground">
          Đặt làm địa chỉ nhận hàng mặc định
        </span>
      </label>

      <div className="pt-4 border-t border-border flex justify-end gap-3">
        <Button type="button" variant="outline" size="md" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          Lưu Địa Chỉ
        </Button>
      </div>
    </form>
  );
}

export default function ProfileAddressModal({
  isOpen,
  onClose,
  editingAddress,
  defaultRecipientName,
  defaultPhone,
  isFirstAddress,
  onSave,
  isLoading,
}: ProfileAddressModalProps) {
  const initialData: AddressFormData = editingAddress
    ? {
        recipientName: editingAddress.recipientName,
        phoneNumber: editingAddress.phoneNumber,
        province: editingAddress.province,
        district: editingAddress.district,
        ward: editingAddress.ward || "",
        detailedAddress: editingAddress.detailedAddress,
        isDefault: editingAddress.isDefault,
        label: editingAddress.label || "Nhà Riêng",
      }
    : {
        recipientName: defaultRecipientName,
        phoneNumber: defaultPhone,
        province: "Hà Nội",
        district: "",
        ward: "",
        detailedAddress: "",
        isDefault: isFirstAddress,
        label: "Nhà Riêng",
      };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAddress ? "Chỉnh Sửa Địa Chỉ" : "Thêm Địa Chỉ Mới"}
      size="lg"
    >
      <AddressFormContent
        key={editingAddress ? editingAddress.id : `new-${isOpen ? "open" : "closed"}`}
        initialData={initialData}
        editingId={editingAddress ? editingAddress.id : null}
        onClose={onClose}
        onSave={onSave}
        isLoading={isLoading}
      />
    </Modal>
  );
}
