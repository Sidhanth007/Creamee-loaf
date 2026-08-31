import type { CakeRequestStatus } from "@prisma/client";

export const CAKE_STATUS_LABELS: Record<CakeRequestStatus, string> = {
  NEW: "Received",
  REVIEWED: "Being reviewed",
  QUOTED: "Quote ready",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  COMPLETED: "Completed",
};

export const CAKE_STATUS_STYLES: Record<CakeRequestStatus, string> = {
  NEW: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
  REVIEWED: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  QUOTED: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300",
  ACCEPTED: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300",
  DECLINED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
  COMPLETED: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-300",
};

export const CAKE_SIZES = ["0.5 kg", "1 kg", "1.5 kg", "2 kg", "3 kg", "Tiered"];
