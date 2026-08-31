import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { setOrderStatus } from "../../actions";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ALLOWED_TRANSITIONS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDeliveryDate,
  formatOrderPlacedAt,
} from "@/lib/orders";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      deliverySlot: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!order) notFound();

  const nextStatuses = ALLOWED_TRANSITIONS[order.status];

  return (
    <main className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-foreground">
          Orders
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-foreground">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatOrderPlacedAt(order.createdAt)} · Payment:{" "}
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            {order.razorpayPaymentId && (
              <span className="ml-1 font-mono text-xs">
                ({order.razorpayPaymentId})
              </span>
            )}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {nextStatuses.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <span className="text-sm font-medium">Move order to:</span>
            {nextStatuses.map((status) => (
              <form key={status} action={setOrderStatus}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  size="sm"
                  variant={status === "CANCELLED" ? "destructive" : "default"}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1 p-5 text-sm">
            <h2 className="mb-1 font-heading text-base font-semibold">Customer</h2>
            <p>{order.user.name}</p>
            <p className="text-muted-foreground">{order.user.email}</p>
            {order.user.phone && <p className="text-muted-foreground">☎ {order.user.phone}</p>}
            <Separator className="my-2" />
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
          <CardContent className="flex flex-col gap-2 p-5">
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
    </main>
  );
}
