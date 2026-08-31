import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { cn } from "@/lib/utils";

const styles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  PLACED: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300",
  PREPARING: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300",
  DELIVERED: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("border-transparent", styles[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
