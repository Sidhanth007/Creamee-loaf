"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { ALLOWED_TRANSITIONS } from "@/lib/orders";
import {
  categorySchema,
  productSchema,
  slotSchema,
  type FieldErrors,
} from "@/lib/validation";

export type AdminFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: boolean;
} | null;

function revalidateAll() {
  revalidatePath("/", "layout");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueSlug(
  model: "product" | "category",
  name: string,
  excludeId?: string
) {
  const base = slugify(name) || "item";
  let slug = base;
  for (let i = 2; ; i++) {
    const existing =
      model === "product"
        ? await db.product.findUnique({ where: { slug } })
        : await db.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

// ---------- Orders ----------

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const next = String(formData.get("status") ?? "") as OrderStatus;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (!ALLOWED_TRANSITIONS[order.status].includes(next)) return;

  await db.order.update({ where: { id: orderId }, data: { status: next } });
  revalidateAll();
}

// ---------- Products ----------

export async function saveProduct(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { priceRupees, imageUrl, ...rest } = parsed.data;
  const productId = String(formData.get("productId") ?? "");
  const data = {
    ...rest,
    price: Math.round(priceRupees * 100),
    imageUrl: imageUrl || null,
  };

  const category = await db.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return { error: "Category not found." };

  if (productId) {
    const existing = await db.product.findUnique({ where: { id: productId } });
    if (!existing) return { error: "Product not found." };
    await db.product.update({ where: { id: productId }, data });
  } else {
    const slug = await uniqueSlug("product", data.name);
    await db.product.create({ data: { ...data, slug } });
  }
  revalidateAll();
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  // Order items keep their snapshot (productId becomes null); cart items cascade.
  await db.product.deleteMany({ where: { id: productId } });
  revalidateAll();
}

export async function toggleProductAvailability(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return;
  await db.product.update({
    where: { id: productId },
    data: { isAvailable: !product.isAvailable },
  });
  revalidateAll();
}

// ---------- Categories ----------

export async function saveCategory(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const categoryId = String(formData.get("categoryId") ?? "");
  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    imageUrl: parsed.data.imageUrl || null,
  };

  if (categoryId) {
    const existing = await db.category.findUnique({ where: { id: categoryId } });
    if (!existing) return { error: "Category not found." };
    await db.category.update({ where: { id: categoryId }, data });
  } else {
    const slug = await uniqueSlug("category", data.name);
    await db.category.create({ data: { ...data, slug } });
  }
  revalidateAll();
  return { success: true };
}

export async function deleteCategory(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") ?? "");
  const productCount = await db.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return {
      error: `This category still has ${productCount} product(s). Move or delete them first.`,
    };
  }
  await db.category.deleteMany({ where: { id: categoryId } });
  revalidateAll();
  return { success: true };
}

// ---------- Reviews ----------

export async function setReviewApproval(formData: FormData) {
  await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  const approve = formData.get("approve") === "true";
  await db.review.updateMany({
    where: { id: reviewId },
    data: { isApproved: approve },
  });
  revalidateAll();
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  await db.review.deleteMany({ where: { id: reviewId } });
  revalidateAll();
}

// ---------- Custom cake requests ----------

const CAKE_STATUSES = [
  "NEW",
  "REVIEWED",
  "QUOTED",
  "ACCEPTED",
  "DECLINED",
  "COMPLETED",
] as const;

export async function updateCakeRequest(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 500);
  const quoteRaw = String(formData.get("quotedPriceRupees") ?? "").trim();

  if (!CAKE_STATUSES.includes(status as (typeof CAKE_STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  let quotedPrice: number | null = null;
  if (quoteRaw) {
    const rupees = Number(quoteRaw);
    if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 100000) {
      return { error: "Enter a valid quote amount in rupees." };
    }
    quotedPrice = Math.round(rupees * 100);
  }
  if (status === "QUOTED" && quotedPrice === null) {
    return { error: "Add a quote amount before marking as Quoted." };
  }

  const request = await db.customCakeRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return { error: "Request not found." };

  await db.customCakeRequest.update({
    where: { id: requestId },
    data: {
      status: status as (typeof CAKE_STATUSES)[number],
      adminNote: adminNote || null,
      quotedPrice: quotedPrice ?? request.quotedPrice,
    },
  });
  revalidateAll();
  return { success: true };
}

// ---------- Delivery slots ----------

export async function saveSlot(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = slotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  if (parsed.data.endTime <= parsed.data.startTime) {
    return { error: "End time must be after start time." };
  }

  const slotId = String(formData.get("slotId") ?? "");
  if (slotId) {
    const existing = await db.deliverySlot.findUnique({ where: { id: slotId } });
    if (!existing) return { error: "Slot not found." };
    await db.deliverySlot.update({ where: { id: slotId }, data: parsed.data });
  } else {
    await db.deliverySlot.create({ data: parsed.data });
  }
  revalidateAll();
  return { success: true };
}

export async function deleteSlot(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const slotId = String(formData.get("slotId") ?? "");
  const orderCount = await db.order.count({ where: { deliverySlotId: slotId } });
  if (orderCount > 0) {
    return {
      error: `This slot is used by ${orderCount} order(s). Deactivate it instead of deleting.`,
    };
  }
  await db.deliverySlot.deleteMany({ where: { id: slotId } });
  revalidateAll();
  return { success: true };
}
