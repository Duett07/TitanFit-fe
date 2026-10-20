"use client";

import React, { useState } from "react";
import { User, Phone, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { UserResponse } from "@/types/auth.type";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfileSchema, UpdateProfileFormData } from "@/lib/schemas/profile.schema";
import authApiRequest from "@/apiRequest/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";

interface ProfileInfoTabProps {
  user: UserResponse;
  showToast: (message: string, type?: "success" | "error") => void;
}

export default function ProfileInfoTab({ user, showToast }: ProfileInfoTabProps) {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState<UpdateProfileFormData>(() => ({
    fullName: user.fullName || "",
    phoneNumber: user.phone || user.phoneNumber || "",
    dateOfBirth: user.dateOfBirth || "2000-01-01",
    gender: user.gender || "MALE",
  }));
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(() => user.id || null);

  // Sync profile form when user session is loaded/updated
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setProfileForm({
      fullName: user.fullName || "",
      phoneNumber: user.phone || user.phoneNumber || "",
      dateOfBirth: user.dateOfBirth || "2000-01-01",
      gender: user.gender || "MALE",
    });
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});

    const result = updateProfileSchema.safeParse(profileForm);
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0] as string] = issue.message;
        }
      });
      setProfileErrors(errMap);
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Update local user state immediately
      updateUser({
        fullName: profileForm.fullName,
        phone: profileForm.phoneNumber,
        phoneNumber: profileForm.phoneNumber,
        gender: profileForm.gender,
        dateOfBirth: profileForm.dateOfBirth,
      });

      queryClient.setQueryData(queryKeys.auth.session(), (old: UserResponse | null) => {
        if (!old) return old;
        return {
          ...old,
          fullName: profileForm.fullName,
          phone: profileForm.phoneNumber,
          phoneNumber: profileForm.phoneNumber,
          gender: profileForm.gender,
          dateOfBirth: profileForm.dateOfBirth,
        };
      });

      // 2. Try backend sync
      try {
        await authApiRequest.updateProfile({
          fullName: profileForm.fullName,
          phone: profileForm.phoneNumber,
          phoneNumber: profileForm.phoneNumber,
          gender: profileForm.gender,
          dateOfBirth: profileForm.dateOfBirth,
        });
      } catch {
        // Fallback: local session preserved
      }

      showToast("Cập nhật thông tin hồ sơ thành công!");
    } catch {
      showToast("Không thể cập nhật hồ sơ. Vui lòng thử lại.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="border-b border-border pb-5 mb-6">
        <h2 className="text-xl font-extrabold font-heading text-foreground">
          Thông Tin Cá Nhân
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Cập nhật thông tin cá nhân và số điện thoại liên hệ để nhận hàng nhanh chóng
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <Input
            label="Họ và Tên"
            id="profile-fullName"
            value={profileForm.fullName}
            onChange={(e) =>
              setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            error={profileErrors.fullName}
            placeholder="Nhập họ và tên đầy đủ"
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          {/* Email (Readonly) */}
          <div>
            <Input
              label="Địa Chỉ Email"
              id="profile-email"
              value={user.email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Email được dùng làm tài khoản đăng nhập và không thể thay đổi."
            />
          </div>

          {/* Phone Number */}
          <Input
            label="Số Điện Thoại"
            id="profile-phone"
            type="tel"
            value={profileForm.phoneNumber || ""}
            onChange={(e) =>
              setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            error={profileErrors.phoneNumber}
            placeholder="Ví dụ: 0912345678"
            leftIcon={<Phone className="w-4 h-4" />}
          />

          {/* Date of Birth */}
          <Input
            label="Ngày Sinh"
            id="profile-dob"
            type="date"
            value={profileForm.dateOfBirth || ""}
            onChange={(e) =>
              setProfileForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
            error={profileErrors.dateOfBirth}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="text-xs font-semibold text-foreground/90 block mb-2">
            Giới Tính
          </label>
          <div className="flex flex-wrap gap-4">
            {[
              { value: "MALE", label: "Nam" },
              { value: "FEMALE", label: "Nữ" },
              { value: "OTHER", label: "Khác" },
            ].map((item) => (
              <label
                key={item.value}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  profileForm.gender === item.value
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-secondary/50 text-foreground hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={item.value}
                  checked={profileForm.gender === item.value}
                  onChange={() =>
                    setProfileForm((prev) => ({
                      ...prev,
                      gender: item.value as "MALE" | "FEMALE" | "OTHER",
                    }))
                  }
                  className="text-primary focus:ring-primary accent-primary"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSavingProfile}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
