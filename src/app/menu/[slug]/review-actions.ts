"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPurchased } from "@/lib/reviews";
import { reviewSchema, type FieldErrors } from "@/lib/validation";

export type ReviewFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: boolean;
} | null;

export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) return { error: "Product not found." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  if (!(await hasPurchased(user.id, productId))) {
    return { error: "You can review products after you've ordered them." };
  }

  const data = {
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    // Edits go back into the moderation queue.
    isApproved: false,
  };
  await db.review.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { ...data, userId: user.id, productId },
    update: data,
  });

  revalidatePath(`/menu/${product.slug}`);
  return { success: true };
}
