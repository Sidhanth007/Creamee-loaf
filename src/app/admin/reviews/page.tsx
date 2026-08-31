import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { deleteReview, setReviewApproval } from "../actions";
import { RatingStars } from "@/components/products/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatOrderPlacedAt } from "@/lib/orders";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <main className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Reviews</h1>
        {pending > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {pending} review{pending === 1 ? "" : "s"} awaiting approval (shown first).
          </p>
        )}
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No reviews yet.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-2 p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} />
                  <Link
                    href={`/menu/${r.product.slug}`}
                    className="font-medium hover:underline"
                  >
                    {r.product.name}
                  </Link>
                  <Badge variant={r.isApproved ? "secondary" : "destructive"}>
                    {r.isApproved ? "Live" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <form action={setReviewApproval}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input
                      type="hidden"
                      name="approve"
                      value={r.isApproved ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant={r.isApproved ? "outline" : "default"}
                    >
                      {r.isApproved ? "Hide" : "Approve"}
                    </Button>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete review"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </form>
                </div>
              </div>
              <p className="text-muted-foreground">
                {r.user.name} ({r.user.email}) · {formatOrderPlacedAt(r.createdAt)}
              </p>
              {r.comment && <p>{r.comment}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
