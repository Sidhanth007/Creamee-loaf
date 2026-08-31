"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const MAX_QTY = 20;

export type CartActionState = { error?: string; success?: boolean } | null;

function revalidateCart() {
  // Header badge lives in the root layout, so revalidate the whole tree.
  revalidatePath("/", "layout");
}

export async function addToCart(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("productId") ?? "");
  const quantity = Math.floor(Number(formData.get("quantity") ?? 1));
  if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY) {
    return { error: "Invalid quantity." };
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };
  if (!product.isAvailable) return { error: "This item is currently sold out." };

  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  const newQty = Math.min((existing?.quantity ?? 0) + quantity, MAX_QTY);
  await db.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, quantity: newQty },
    update: { quantity: newQty },
  });

  revalidateCart();
  return { success: true };
}

export async function setCartItemQuantity(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Math.floor(Number(formData.get("quantity") ?? 0));
  if (!itemId || !Number.isFinite(quantity)) return;

  const item = await db.cartItem.findFirst({
    where: { id: itemId, userId: user.id },
  });
  if (!item) return;

  if (quantity < 1) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    await db.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, MAX_QTY) },
    });
  }
  revalidateCart();
}

export async function removeCartItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemId = String(formData.get("itemId") ?? "");
  await db.cartItem.deleteMany({ where: { id: itemId, userId: user.id } });
  revalidateCart();
}
