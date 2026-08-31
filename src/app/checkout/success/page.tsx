import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Order placed" };

export default async function SuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { order: orderNumber } = await searchParams;
  if (!orderNumber || typeof orderNumber !== "string") redirect("/");

  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, deliverySlot: true },
  });
  if (!order) redirect("/");

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(order.deliveryDate);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16">
      <CircleCheck className="size-14 text-green-600" />
      <h1 className="mt-4 font-heading text-3xl font-semibold">Order placed!</h1>
      <p className="mt-1 text-muted-foreground">
        Thank you, {user.name.split(" ")[0]} — your bakes are on the calendar.
      </p>

      <Card className="mt-8 w-full">
        <CardContent className="flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order number</span>
            <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Delivery</span>
            <span className="text-sm font-medium">
              {dateLabel} · {order.deliverySlot.label} ({order.deliverySlot.startTime}–
              {order.deliverySlot.endTime})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deliver to</span>
            <span className="max-w-[60%] text-right text-sm">
              {order.deliveryLine1}, {order.deliveryCity} — {order.deliveryPincode}
            </span>
          </div>
          <Separator />
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery fee</span>
            <span>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total paid (test)</span>
            <span className="font-heading text-lg">{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" render={<Link href="/menu" />}>
          Order more
        </Button>
        <Button render={<Link href={`/orders/${order.orderNumber}`} />}>
          Track order
        </Button>
      </div>
    </main>
  );
}
