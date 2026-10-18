import { z } from "zod";

export const userRoleSchema = z.enum(["ROLE_ADMIN", "ROLE_USER"]);

export const userResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email("Email không hợp lệ"),
  role: userRoleSchema,
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.string().optional(),
  tier: z.string().optional(),
});

export function validateUserResponse(data: unknown) {
  return userResponseSchema.safeParse(data);
}
