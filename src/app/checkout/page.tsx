import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isoDateInDays } from "@/lib/dates";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [addresses, slots, cartItems] = await Promise.all([
    db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { label: "asc" }],
    }),
    db.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.cartItem.findMany({
      where: { userId: user.id, product: { isAvailable: true } },
      include: { product: { select: { name: true, price: true, unitLabel: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (cartItems.length === 0) redirect("/cart");

  if (addresses.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Add a delivery address first
        </h1>
        <p className="text-sm text-muted-foreground">
          We need to know where to bring your order. Add an address to your
          account, then come back to checkout.
        </p>
        <Button render={<Link href="/account" />}>Add address</Button>
      </main>
    );
  }

  const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= site.freeDeliveryAbove ? 0 : site.deliveryFee;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Checkout</h1>
      <CheckoutForm
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          summary: `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city} — ${a.pincode}`,
          phone: a.phone,
          isDefault: a.isDefault,
        }))}
        slots={slots.map((s) => ({
          id: s.id,
          label: `${s.label} (${s.startTime}–${s.endTime})`,
        }))}
        items={cartItems.map((i) => ({
          id: i.id,
          name: i.product.name,
          unitLabel: i.product.unitLabel,
          quantity: i.quantity,
          lineTotal: i.product.price * i.quantity,
        }))}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        liveGateway={isRazorpayConfigured()}
        minDate={isoDateInDays(1)}
        maxDate={isoDateInDays(30)}
      />
    </main>
  );
}
