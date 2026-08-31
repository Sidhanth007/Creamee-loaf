import type { Metadata } from "next";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { RequestEditor } from "./request-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CAKE_STATUS_LABELS, CAKE_STATUS_STYLES } from "@/lib/cake-requests";
import { formatDeliveryDate, formatOrderPlacedAt } from "@/lib/orders";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cake requests" };

export default async function AdminCakeRequestsPage() {
  const requests = await db.customCakeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  return (
    <main className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
        Custom cake requests
      </h1>

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No requests yet. They&apos;ll appear here when customers use the
            Custom cakes page.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 p-5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {r.occasion} · {r.sizeLabel} · {r.flavour}
                    {r.isEggless && (
                      <Badge variant="secondary" className="ml-2">
                        Eggless
                      </Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {r.user.name} ({r.user.email}
                    {r.user.phone ? `, ☎ ${r.user.phone}` : ""})
                  </p>
                  <p className="text-muted-foreground">
                    Requested {formatOrderPlacedAt(r.createdAt)} · Needed by{" "}
                    <span className="font-medium text-foreground">
                      {formatDeliveryDate(r.neededByDate)}
                    </span>
                  </p>
                </div>
                <Badge className={cn("border-transparent", CAKE_STATUS_STYLES[r.status])}>
                  {CAKE_STATUS_LABELS[r.status]}
                </Badge>
              </div>

              {r.cakeMessage && (
                <p>
                  <span className="text-muted-foreground">On the cake: </span>
                  “{r.cakeMessage}”
                </p>
              )}
              {r.instructions && (
                <p className="rounded-lg bg-secondary/60 p-3 text-xs">
                  {r.instructions}
                </p>
              )}
              {r.referenceImageUrl && (
                <a
                  href={r.referenceImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative h-40 w-full overflow-hidden rounded-lg border"
                >
                  <Image
                    src={r.referenceImageUrl}
                    alt="Reference"
                    fill
                    sizes="600px"
                    className="object-cover"
                  />
                </a>
              )}

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-medium">
                  {r.quotedPrice != null
                    ? `Quoted: ${formatPrice(r.quotedPrice)}`
                    : "Not quoted yet"}
                </span>
                <RequestEditor
                  requestId={r.id}
                  status={r.status}
                  quotedPriceRupees={
                    r.quotedPrice != null ? String(r.quotedPrice / 100) : ""
                  }
                  adminNote={r.adminNote ?? ""}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Pencil data-icon="inline-start" /> Update
                    </Button>
                  }
                />
              </div>
              {r.adminNote && (
                <p className="text-xs text-muted-foreground">
                  Your note: {r.adminNote}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
