import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  const { email } = await searchParams;
  if (!email || typeof email !== "string") redirect("/forgot-password");

  return <ResetPasswordForm email={email} />;
}
