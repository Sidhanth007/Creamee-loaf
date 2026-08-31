import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { isoDateInDays } from "@/lib/dates";
import { CakeRequestForm } from "./request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CAKE_STATUS_LABELS, CAKE_STATUS_STYLES } from "@/lib/cake-requests";
import { formatDeliveryDate } from "@/lib/orders";
import { formatPrice } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Custom cakes",
  description: "Dream it, we bake it — request a fully custom celebration cake.",
};

export default async function CustomCakesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const requests = await db.customCakeRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Custom celebration cakes
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us about your dream cake — occasion, size, flavour, and any
          reference photo. We&apos;ll review it and come back with a quote.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <CakeRequestForm
          uploadsEnabled={isCloudinaryConfigured()}
          minDate={isoDateInDays(2)}
          maxDate={isoDateInDays(60)}
        />

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">My requests</h2>
          {requests.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Your requests will appear here with their status and quote.
            </p>
          )}
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-2 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.occasion} · {r.sizeLabel}
                  </span>
                  <Badge className={cn("border-transparent", CAKE_STATUS_STYLES[r.status])}>
                    {CAKE_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {r.flavour}
                  {r.isEggless ? " · Eggless" : ""} · Needed by{" "}
                  {formatDeliveryDate(r.neededByDate)}
                </p>
                {r.referenceImageUrl && (
                  <div className="relative h-28 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={r.referenceImageUrl}
                      alt="Reference"
                      fill
                      sizes="360px"
                      className="object-cover"
                    />
                  </div>
                )}
                {r.status === "QUOTED" && r.quotedPrice != null && (
                  <p className="rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary">
                    Quoted: {formatPrice(r.quotedPrice)}
                  </p>
                )}
                {r.adminNote && (
                  <p className="rounded-lg bg-secondary/60 p-3 text-xs">
                    Baker&apos;s note: {r.adminNote}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
