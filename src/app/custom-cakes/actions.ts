"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { cakeRequestSchema, type FieldErrors } from "@/lib/validation";

export type CakeRequestState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: boolean;
} | null;

const MIN_LEAD_DAYS = 2;
const MAX_ADVANCE_DAYS = 60;

export async function submitCakeRequest(
  _prev: CakeRequestState,
  formData: FormData
): Promise<CakeRequestState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = cakeRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const date = new Date(`${parsed.data.neededByDate}T00:00:00.000Z`);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = (date.getTime() - todayUtc) / (24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime()) || days < MIN_LEAD_DAYS || days > MAX_ADVANCE_DAYS) {
    return {
      error: `Custom cakes need at least ${MIN_LEAD_DAYS} days' notice (and at most ${MAX_ADVANCE_DAYS} days ahead).`,
    };
  }

  let referenceImageUrl: string | null = null;
  const image = formData.get("referenceImage");
  if (image instanceof File && image.size > 0) {
    if (!isCloudinaryConfigured()) {
      return { error: "Image uploads aren't enabled yet — submit without an image, or add Cloudinary keys." };
    }
    const uploaded = await uploadImage(image, "creamee-loaf/cake-refs");
    if (!uploaded.ok) return { error: uploaded.error };
    referenceImageUrl = uploaded.url;
  }

  await db.customCakeRequest.create({
    data: {
      userId: user.id,
      occasion: parsed.data.occasion,
      sizeLabel: parsed.data.sizeLabel,
      flavour: parsed.data.flavour,
      isEggless: parsed.data.isEggless,
      cakeMessage: parsed.data.cakeMessage || null,
      instructions: parsed.data.instructions || null,
      neededByDate: date,
      referenceImageUrl,
    },
  });

  revalidatePath("/custom-cakes");
  return { success: true };
}
