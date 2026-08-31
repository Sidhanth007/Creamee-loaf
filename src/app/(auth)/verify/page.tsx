import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { email } = await searchParams;
  if (!email || typeof email !== "string") redirect("/register");

  return <VerifyForm email={email} />;
}
