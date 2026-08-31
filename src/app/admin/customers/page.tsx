import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
        select: { total: true },
      },
    },
  });

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Customers</h1>

      <Card>
        <CardContent className="p-5">
          {customers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No customers yet. (Your admin account is not listed here.)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Lifetime value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.emailVerified ? "secondary" : "destructive"}>
                          {c.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(c.createdAt)}
                      </TableCell>
                      <TableCell>{c.orders.length}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(c.orders.reduce((s, o) => s + o.total, 0))}
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
