"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { issueOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession, destroySession } from "@/lib/auth/session";
import { sendOtpEmail } from "@/lib/email/brevo";
import { rateLimit } from "@/lib/rate-limit";
import {
  loginSchema,
  otpSchema,
  registerSchema,
  type FieldErrors,
} from "@/lib/validation";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  message?: string;
} | null;

function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase();
}

async function sendVerificationCode(email: string): Promise<string | null> {
  const otp = await issueOtp(email, "VERIFY_EMAIL");
  if (!otp.ok) return otp.error;
  const sent = await sendOtpEmail(email, otp.code, otp.ttlMinutes);
  if (!sent.ok) return sent.error;
  return null;
}

export async function register(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password } = parsed.data;

  if (!rateLimit(`register:${email}`, 5, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.emailVerified) {
    return { error: "An account with this email already exists. Please sign in." };
  }

  const passwordHash = await hashPassword(password);
  const role = email === adminEmail() ? "ADMIN" : "CUSTOMER";
  if (existing) {
    // Unverified leftover registration — refresh it.
    await db.user.update({
      where: { id: existing.id },
      data: { name, passwordHash, role },
    });
  } else {
    await db.user.create({ data: { name, email, passwordHash, role } });
  }

  const error = await sendVerificationCode(email);
  if (error) return { error };

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyEmail(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = otpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please enter the 6-digit code sent to your email." };
  }
  const { email, code } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Account not found. Please register again." };

  const result = await verifyOtp(email, "VERIFY_EMAIL", code);
  if (!result.ok) return { error: result.error };

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      role: email === adminEmail() ? "ADMIN" : user.role,
    },
  });
  await createSession(user.id);
  redirect("/");
}

export async function resendCode(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Missing email address." };
  const error = await sendVerificationCode(email);
  if (error) return { error };
  return { message: "A new code is on its way to your inbox." };
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, password } = parsed.data;

  if (!rateLimit(`login:${email}`, 10, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Same error for wrong email and wrong password — don't leak which exists.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  if (!user.emailVerified) {
    const error = await sendVerificationCode(email);
    if (error) return { error };
    redirect(`/verify?email=${encodeURIComponent(email)}`);
  }

  if (email === adminEmail() && user.role !== "ADMIN") {
    await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
