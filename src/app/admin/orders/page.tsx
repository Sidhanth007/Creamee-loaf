import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORDER_STATUS_LABELS, formatDeliveryDate, formatOrderPlacedAt } from "@/lib/orders";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "PENDING_PAYMENT",
];

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : "ALL";
  const filter = FILTERS.includes(raw as OrderStatus | "ALL")
    ? (raw as OrderStatus | "ALL")
    : "ALL";

  const orders = await db.order.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      deliverySlot: { select: { label: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Orders</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted"
            )}
          >
            {f === "ALL" ? "All" : ORDER_STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No orders with this status.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="font-mono text-xs font-semibold hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="block">{o.user.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {o.user.email}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrderPlacedAt(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDeliveryDate(o.deliveryDate)}
                        <span className="block text-xs">{o.deliverySlot.label}</span>
                      </TableCell>
                      <TableCell>{o._count.items}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPrice(o.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
