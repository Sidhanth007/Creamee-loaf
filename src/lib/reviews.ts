import "server-only";
import { db } from "@/lib/db";

/** True if the user has a paid, non-cancelled order containing this product. */
export async function hasPurchased(userId: string, productId: string) {
  const item = await db.orderItem.findFirst({
    where: {
      productId,
      order: { userId, paymentStatus: "PAID", status: { not: "CANCELLED" } },
    },
  });
  return Boolean(item);
}
