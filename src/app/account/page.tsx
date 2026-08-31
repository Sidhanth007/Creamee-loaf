import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";
import { AddressList } from "./address-list";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold">My account</h1>
        <Button variant="outline" render={<Link href="/orders" />}>
          <Package data-icon="inline-start" /> My orders
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      <div className="mt-8 flex flex-col gap-8">
        <ProfileForm name={user.name} phone={user.phone ?? ""} />
        <AddressList
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            line1: a.line1,
            line2: a.line2 ?? "",
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            phone: a.phone,
            isDefault: a.isDefault,
          }))}
        />
      </div>
    </main>
  );
}
