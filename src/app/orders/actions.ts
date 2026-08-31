"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

// Customers can cancel only before the bakery confirms the order.
export async function cancelOrder(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const orderId = String(formData.get("orderId") ?? "");
  await db.order.updateMany({
    where: { id: orderId, userId: user.id, status: "PLACED" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/orders");
}
