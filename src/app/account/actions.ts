"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/session";
import {
  addressSchema,
  changePasswordSchema,
  profileSchema,
  type FieldErrors,
} from "@/lib/validation";

export type AccountFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: boolean;
} | null;

export async function updateProfile(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  });
  revalidatePath("/account");
  return { success: true };
}

export async function changePassword(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!record || !(await verifyPassword(parsed.data.currentPassword, record.passwordHash))) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  return { success: true };
}

export async function saveAddress(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in again." };

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { isDefault, ...data } = parsed.data;
  const addressId = formData.get("addressId");

  if (typeof addressId === "string" && addressId) {
    const existing = await db.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!existing) return { error: "Address not found." };
    await db.address.update({
      where: { id: addressId },
      data: { ...data, line2: data.line2 || null },
    });
    if (isDefault) await makeDefault(user.id, addressId);
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    const created = await db.address.create({
      data: {
        ...data,
        line2: data.line2 || null,
        userId: user.id,
        isDefault: count === 0,
      },
    });
    if (isDefault && count > 0) await makeDefault(user.id, created.id);
  }

  revalidatePath("/account");
  return { success: true };
}

async function makeDefault(userId: string, addressId: string) {
  await db.$transaction([
    db.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}

export async function setDefaultAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const addressId = String(formData.get("addressId") ?? "");
  const address = await db.address.findFirst({
    where: { id: addressId, userId: user.id },
  });
  if (!address) return;
  await makeDefault(user.id, addressId);
  revalidatePath("/account");
}

export async function deleteAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const addressId = String(formData.get("addressId") ?? "");
  await db.address.deleteMany({ where: { id: addressId, userId: user.id } });
  revalidatePath("/account");
}
