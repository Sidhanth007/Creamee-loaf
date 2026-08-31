"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { site } from "@/lib/site";

const MAX_ADVANCE_DAYS = 30;

export type PlaceOrderState = {
  error?: string;
  payment?: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    keyId: string;
    amount: number;
    name: string;
    email: string;
    contact: string;
  };
} | null;

function newOrderNumber() {
  return `CL-${Date.now().toString(36).toUpperCase()}${randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
}

function parseDeliveryDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const min = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);
  const max = new Date(todayUtc.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
  if (date < min || date > max) return null;
  return date;
}

export async function placeOrder(
  _prev: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addressId = String(formData.get("addressId") ?? "");
  const slotId = String(formData.get("slotId") ?? "");
  const dateRaw = String(formData.get("deliveryDate") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  const deliveryDate = parseDeliveryDate(dateRaw);
  if (!deliveryDate) {
    return { error: "Please pick a delivery date between tomorrow and 30 days from now." };
  }

  const [address, slot, cartItems] = await Promise.all([
    db.address.findFirst({ where: { id: addressId, userId: user.id } }),
    db.deliverySlot.findFirst({ where: { id: slotId, isActive: true } }),
    db.cartItem.findMany({
      where: { userId: user.id, product: { isAvailable: true } },
      include: { product: true },
    }),
  ]);

  if (!address) return { error: "Please choose a delivery address." };
  if (!slot) return { error: "Please choose a delivery time slot." };
  if (cartItems.length === 0) return { error: "Your cart has no available items." };

  const booked = await db.order.count({
    where: {
      deliverySlotId: slot.id,
      deliveryDate,
      status: { not: "CANCELLED" },
    },
  });
  if (booked >= slot.capacity) {
    return { error: `The ${slot.label} slot is fully booked for that date — please pick another.` };
  }

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= site.freeDeliveryAbove ? 0 : site.deliveryFee;
  const total = subtotal + deliveryFee;

  const order = await db.order.create({
    data: {
      orderNumber: newOrderNumber(),
      userId: user.id,
      subtotal,
      deliveryFee,
      total,
      deliveryDate,
      deliverySlotId: slot.id,
      deliveryName: user.name,
      deliveryPhone: address.phone,
      deliveryLine1: address.line1,
      deliveryLine2: address.line2,
      deliveryCity: address.city,
      deliveryState: address.state,
      deliveryPincode: address.pincode,
      customerNote: note,
      items: {
        create: cartItems.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
        })),
      },
    },
  });

  if (!isRazorpayConfigured()) {
    // Demo mode: no gateway keys yet — simulate a successful test payment.
    await completeOrder(order.id, user.id, `demo_${order.id}`);
    redirect(`/checkout/success?order=${order.orderNumber}`);
  }

  const razorpayOrderId = await createRazorpayOrder(total, order.orderNumber);
  if (!razorpayOrderId) {
    return { error: "Could not reach the payment gateway. Please try again." };
  }
  await db.order.update({
    where: { id: order.id },
    data: { razorpayOrderId },
  });

  return {
    payment: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      keyId: razorpayKeyId(),
      amount: total,
      name: user.name,
      email: user.email,
      contact: address.phone,
    },
  };
}

async function completeOrder(orderId: string, userId: string, paymentId: string) {
  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { status: "PLACED", paymentStatus: "PAID", razorpayPaymentId: paymentId },
    }),
    db.cartItem.deleteMany({ where: { userId } }),
  ]);
  revalidatePath("/", "layout");
}

export async function verifyPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ ok: boolean; orderNumber?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const order = await db.order.findFirst({
    where: {
      id: input.orderId,
      userId: user.id,
      razorpayOrderId: input.razorpayOrderId,
      paymentStatus: "PENDING",
    },
  });
  if (!order) return { ok: false, error: "Order not found." };

  const valid = verifyPaymentSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature
  );
  if (!valid) {
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return { ok: false, error: "Payment verification failed." };
  }

  await completeOrder(order.id, user.id, input.razorpayPaymentId);
  return { ok: true, orderNumber: order.orderNumber };
}
