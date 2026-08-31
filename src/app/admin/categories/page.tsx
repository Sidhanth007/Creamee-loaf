import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { deleteCategory } from "../actions";
import { DeleteEntityButton } from "../delete-button";
import { CategoryDialog } from "./category-dialog";
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

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Categories
        </h1>
        <CategoryDialog
          trigger={
            <Button>
              <Plus data-icon="inline-start" /> New category
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
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-medium">{c.name}</span>
                      {c.description && (
                        <span className="block text-xs text-muted-foreground">
                          {c.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{c._count.products}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.sortOrder}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? "secondary" : "destructive"}>
                        {c.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <CategoryDialog
                          category={{
                            id: c.id,
                            name: c.name,
                            description: c.description ?? "",
                            imageUrl: c.imageUrl ?? "",
                            sortOrder: c.sortOrder,
                            isActive: c.isActive,
                          }}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Edit">
                              <Pencil />
                            </Button>
                          }
                        />
                        <DeleteEntityButton
                          action={deleteCategory}
                          fieldName="categoryId"
                          fieldValue={c.id}
                          label={`Delete ${c.name}`}
                        />
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
