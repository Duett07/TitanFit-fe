import { z } from "zod";

const vietnamesePhoneRegex = /^(0|\+84)[0-9]{9,10}$/;

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được vượt quá 100 ký tự"),
  phoneNumber: z
    .string()
    .trim()
    .regex(vietnamesePhoneRegex, "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(64, "Mật khẩu không được dài quá 64 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2, "Tên người nhận phải có ít nhất 2 ký tự"),
  phoneNumber: z
    .string()
    .trim()
    .regex(vietnamesePhoneRegex, "Số điện thoại nhận hàng không hợp lệ"),
  province: z.string().trim().min(1, "Vui lòng chọn hoặc nhập Tỉnh / Thành phố"),
  district: z.string().trim().min(1, "Vui lòng chọn hoặc nhập Quận / Huyện"),
  ward: z.string().trim().optional(),
  detailedAddress: z
    .string()
    .trim()
    .min(5, "Địa chỉ chi tiết (số nhà, tên đường) phải có ít nhất 5 ký tự"),
  isDefault: z.boolean().default(false),
  label: z.enum(["Nhà Riêng", "Văn Phòng", "Khác"]).default("Nhà Riêng"),
});

export type AddressFormData = z.infer<typeof addressSchema>;
