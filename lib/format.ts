/**
 * Format number into Vietnamese Dong (VND) currency string
 * Example: 1850000 -> "1.850.000 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}
