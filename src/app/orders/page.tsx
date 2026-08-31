import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PackageOpen } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { formatDeliveryDate, formatOrderPlacedAt } from "@/lib/orders";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      deliverySlot: { select: { label: true } },
      _count: { select: { items: true } },
    },
  });

  if (orders.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <PackageOpen className="size-12 text-muted-foreground/40" />
        <h1 className="font-heading text-2xl font-semibold">No orders yet</h1>
        <p className="text-sm text-muted-foreground">
          When you place an order, it will show up here with live status.
        </p>
        <Button render={<Link href="/menu" />}>Browse the menu</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">My orders</h1>
      <div className="mt-8 flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.orderNumber}`}
            className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  {order.orderNumber}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                Placed {formatOrderPlacedAt(order.createdAt)} ·{" "}
                {order._count.items} item{order._count.items === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-muted-foreground">
                Delivery: {formatDeliveryDate(order.deliveryDate)} ·{" "}
                {order.deliverySlot.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-semibold">
                {formatPrice(order.total)}
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
