import { redirect } from "next/navigation";

export default function OrderSuccessIndexPage() {
  // If user accesses /order-success directly without an order code, redirect to their order tracking page
  redirect("/order-tracking");
}
