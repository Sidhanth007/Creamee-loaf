import Link from "next/link";
import { IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
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
import { formatDeliveryDate, formatOrderPlacedAt } from "@/lib/orders";
import { formatPrice } from "@/lib/site";

export default async function AdminOverviewPage() {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [revenue, orderCount, customerCount, needsAction, upcoming, recentOrders, topProducts] =
    await Promise.all([
      db.order.aggregate({
        where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.order.count({ where: { status: { notIn: ["PENDING_PAYMENT"] } } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.order.count({ where: { status: "PLACED" } }),
      db.order.count({
        where: {
          deliveryDate: { gte: now, lte: weekAhead },
          status: { notIn: ["CANCELLED", "DELIVERED", "PENDING_PAYMENT"] },
        },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
      db.orderItem.groupBy({
        by: ["name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const stats = [
    {
      icon: IndianRupee,
      label: "Test revenue",
      value: formatPrice(revenue._sum.total ?? 0),
    },
    { icon: ShoppingBag, label: "Orders", value: String(orderCount) },
    { icon: Users, label: "Customers", value: String(customerCount) },
    { icon: Package, label: "Deliveries next 7 days", value: String(upcoming) },
  ];

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Overview</h1>
        {needsAction > 0 && (
          <p className="mt-1 text-sm">
            <Link href="/admin/orders?status=PLACED" className="font-medium text-primary hover:underline">
              {needsAction} new order{needsAction === 1 ? "" : "s"} waiting for confirmation →
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" />
                <span className="text-sm">{label}</span>
              </div>
              <span className="font-heading text-2xl font-semibold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold">Recent orders</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${o.orderNumber}`}
                          className="font-mono text-xs font-semibold hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{o.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatOrderPlacedAt(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDeliveryDate(o.deliveryDate)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(o.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="p-5">
            <h2 className="mb-3 font-heading text-lg font-semibold">Top products</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-2">
                  <span>
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {p._sum.quantity} sold
                  </span>
                </li>
              ))}
              {topProducts.length === 0 && (
                <p className="text-muted-foreground">No sales yet.</p>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
