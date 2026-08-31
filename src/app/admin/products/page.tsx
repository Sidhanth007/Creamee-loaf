import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { deleteProduct, toggleProductAvailability } from "../actions";
import { ProductDialog } from "./product-dialog";
import { ProductImage } from "@/components/products/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Products</h1>
        <ProductDialog
          categories={categories}
          trigger={
            <Button>
              <Plus data-icon="inline-start" /> New product
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border">
                          <ProductImage src={p.imageUrl} alt={p.name} sizes="40px" />
                        </div>
                        <div>
                          <span className="block font-medium">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.unitLabel}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category.name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(p.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.isEggless && <Badge variant="secondary">Eggless</Badge>}
                        {p.isFeatured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <form action={toggleProductAvailability}>
                        <input type="hidden" name="productId" value={p.id} />
                        <Button
                          type="submit"
                          size="xs"
                          variant={p.isAvailable ? "secondary" : "destructive"}
                        >
                          {p.isAvailable ? "Available" : "Sold out"}
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ProductDialog
                          categories={categories}
                          product={{
                            id: p.id,
                            name: p.name,
                            description: p.description,
                            priceRupees: p.price / 100,
                            unitLabel: p.unitLabel,
                            categoryId: p.categoryId,
                            imageUrl: p.imageUrl ?? "",
                            isEggless: p.isEggless,
                            isFeatured: p.isFeatured,
                            isAvailable: p.isAvailable,
                          }}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Edit">
                              <Pencil />
                            </Button>
                          }
                        />
                        <form action={deleteProduct}>
                          <input type="hidden" name="productId" value={p.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
