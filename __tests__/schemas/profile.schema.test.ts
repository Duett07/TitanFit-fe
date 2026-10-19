import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
} from "@/lib/schemas/profile.schema";

describe("Profile Schemas", () => {
  describe("updateProfileSchema", () => {
    it("validates valid profile data", () => {
      const valid = {
        fullName: "Nguyễn Văn Titan",
        phoneNumber: "0912345678",
        gender: "MALE",
        dateOfBirth: "1995-05-15",
      };
      const result = updateProfileSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when fullName is too short", () => {
      const invalid = {
        fullName: "A",
      };
      const result = updateProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("fails on invalid phone number", () => {
      const invalid = {
        fullName: "Nguyễn Văn Titan",
        phoneNumber: "12345",
      };
      const result = updateProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("validates matching valid passwords", () => {
      const valid = {
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword456",
        confirmPassword: "NewSecurePassword456",
      };
      const result = changePasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when confirm password does not match", () => {
      const mismatch = {
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword456",
        confirmPassword: "DifferentPassword789",
      };
      const result = changePasswordSchema.safeParse(mismatch);
      expect(result.success).toBe(false);
    });

    it("fails when new password is identical to current password", () => {
      const identical = {
        currentPassword: "SamePassword123",
        newPassword: "SamePassword123",
        confirmPassword: "SamePassword123",
      };
      const result = changePasswordSchema.safeParse(identical);
      expect(result.success).toBe(false);
    });
  });

  describe("addressSchema", () => {
    it("validates full valid address", () => {
      const valid = {
        recipientName: "Đỗ Minh Đức",
        phoneNumber: "0987654321",
        province: "Hà Nội",
        district: "Cầu Giấy",
        ward: "Dịch Vọng Hậu",
        detailedAddress: "Số 18, Ngõ 45 Duy Tân",
        isDefault: true,
        label: "Nhà Riêng",
      };
      const result = addressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("fails when detailedAddress is too short", () => {
      const invalid = {
        recipientName: "Đỗ Minh Đức",
        phoneNumber: "0987654321",
        province: "Hà Nội",
        district: "Cầu Giấy",
        detailedAddress: "1",
      };
      const result = addressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
