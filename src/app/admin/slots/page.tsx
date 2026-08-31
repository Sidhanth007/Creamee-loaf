import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { deleteSlot } from "../actions";
import { DeleteEntityButton } from "../delete-button";
import { SlotDialog } from "./slot-dialog";
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

export const metadata: Metadata = { title: "Delivery slots" };

export default async function AdminSlotsPage() {
  const slots = await db.deliverySlot.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <main className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Delivery slots
        </h1>
        <SlotDialog
          trigger={
            <Button>
              <Plus data-icon="inline-start" /> New slot
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
                  <TableHead>Slot</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Capacity/day</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.startTime}–{s.endTime}
                    </TableCell>
                    <TableCell>{s.capacity}</TableCell>
                    <TableCell>{s._count.orders}</TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "secondary" : "destructive"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <SlotDialog
                          slot={{
                            id: s.id,
                            label: s.label,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            capacity: s.capacity,
                            sortOrder: s.sortOrder,
                            isActive: s.isActive,
                          }}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label="Edit">
                              <Pencil />
                            </Button>
                          }
                        />
                        <DeleteEntityButton
                          action={deleteSlot}
                          fieldName="slotId"
                          fieldValue={s.id}
                          label={`Delete ${s.label}`}
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
