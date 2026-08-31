import "server-only";
import { createHash, randomInt } from "node:crypto";
import type { OtpPurpose } from "@prisma/client";
import { db } from "@/lib/db";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function issueOtp(email: string, purpose: OtpPurpose) {
  const latest = await db.otpCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (
    latest &&
    Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return {
      ok: false as const,
      error: "Please wait a minute before requesting another code.",
    };
  }

  const code = randomInt(100000, 1000000).toString();
  await db.otpCode.create({
    data: {
      email,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  return { ok: true as const, code, ttlMinutes: OTP_TTL_MINUTES };
}

export async function verifyOtp(
  email: string,
  purpose: OtpPurpose,
  code: string
) {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) {
    return { ok: false as const, error: "No code found. Please request a new one." };
  }
  if (otp.expiresAt < new Date()) {
    return { ok: false as const, error: "This code has expired. Please request a new one." };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Too many wrong attempts. Please request a new code." };
  }
  if (otp.codeHash !== hashCode(code)) {
    await db.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false as const, error: "Incorrect code. Please try again." };
  }
  await db.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true as const };
}
