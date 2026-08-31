import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { cancelOrder } from "../actions";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDeliveryDate,
  formatOrderPlacedAt,
} from "@/lib/orders";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[orderNumber]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { orderNumber } = await params;
  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, deliverySlot: true },
  });
  if (!order) notFound();

  const flowIndex = ORDER_FLOW.indexOf(order.status);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground">
          My orders
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-foreground">{order.orderNumber}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Order {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {formatOrderPlacedAt(order.createdAt)} · Payment:{" "}
        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
      </p>

      {order.status !== "CANCELLED" && order.status !== "PENDING_PAYMENT" && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-2">
              {ORDER_FLOW.map((step, i) => {
                const done = flowIndex >= i;
                const isLast = i === ORDER_FLOW.length - 1;
                return (
                  <li key={step} className="flex sm:flex-1 sm:flex-col sm:items-center">
                    <div className="flex items-center sm:w-full sm:flex-row">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {done ? <Check className="size-4" /> : i + 1}
                      </span>
                      {!isLast && (
                        <span
                          className={cn(
                            "hidden h-0.5 flex-1 sm:block",
                            flowIndex > i ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "ml-3 pb-4 text-sm sm:mt-2 sm:ml-0 sm:pb-0 sm:pr-2 sm:text-center sm:text-xs",
                        done ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {ORDER_STATUS_LABELS[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1 p-6 text-sm">
            <h2 className="mb-1 font-heading text-base font-semibold">Delivery</h2>
            <p>
              {formatDeliveryDate(order.deliveryDate)} · {order.deliverySlot.label} (
              {order.deliverySlot.startTime}–{order.deliverySlot.endTime})
            </p>
            <p className="text-muted-foreground">
              {order.deliveryName} · ☎ {order.deliveryPhone}
            </p>
            <p className="text-muted-foreground">
              {order.deliveryLine1}
              {order.deliveryLine2 ? `, ${order.deliveryLine2}` : ""},{" "}
              {order.deliveryCity}, {order.deliveryState} — {order.deliveryPincode}
            </p>
            {order.customerNote && (
              <p className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs">
                “{order.customerNote}”
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 p-6">
            <h2 className="mb-1 font-heading text-base font-semibold">Items</h2>
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
            <Separator className="my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>
                {order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-heading">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.status === "PLACED" && (
        <form action={cancelOrder} className="mt-6">
          <input type="hidden" name="orderId" value={order.id} />
          <Button type="submit" variant="destructive">
            Cancel this order
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            You can cancel until the bakery confirms your order.
          </p>
        </form>
      )}
    </main>
  );
}
