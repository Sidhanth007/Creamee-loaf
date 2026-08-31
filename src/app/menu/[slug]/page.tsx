import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPurchased } from "@/lib/reviews";
import { AddToCart } from "@/components/products/add-to-cart";
import { ProductImage } from "@/components/products/product-image";
import { RatingStars } from "@/components/products/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/site";
import { ReviewForm } from "./review-form";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: { category: { select: { name: true, slug: true } } },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  return { title: product.name, description: product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const [reviews, myReview, canReview] = await Promise.all([
    db.review.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    user
      ? db.review.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        })
      : null,
    user ? hasPurchased(user.id, product.id) : false,
  ]);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/menu" className="hover:text-foreground">
          Menu
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/menu?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.isEggless && (
              <Badge className="border-green-700/20 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                Eggless
              </Badge>
            )}
            {product.isFeatured && <Badge variant="secondary">Bestseller</Badge>}
            {!product.isAvailable && (
              <Badge variant="destructive">Currently sold out</Badge>
            )}
          </div>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
            {product.name}
          </h1>
          {avgRating !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RatingStars rating={avgRating} />
              <span>
                {avgRating.toFixed(1)} · {reviews.length} review
                {reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          <p className="text-muted-foreground">{product.description}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">/ {product.unitLabel}</span>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <AddToCart productId={product.id} isAvailable={product.isAvailable} />
            <p className="text-xs text-muted-foreground">
              Baked fresh to order. Delivery date and time slot are chosen at checkout.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-heading text-2xl font-semibold">Reviews</h2>

        {user && canReview && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-medium">
                {myReview ? "Your review" : "Ordered this? Leave a review"}
              </h3>
              {myReview && !myReview.isApproved && (
                <p className="mb-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  Your review is awaiting approval.
                </p>
              )}
              <ReviewForm
                productId={product.id}
                existing={
                  myReview
                    ? { rating: myReview.rating, comment: myReview.comment ?? "" }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}
        {user && !canReview && (
          <p className="mt-4 text-sm text-muted-foreground">
            Reviews are open to customers who have ordered this item.
          </p>
        )}
        {!user && (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to review this product after ordering it.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reviews yet — be the first!
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{r.user.name}</span>
                <RatingStars rating={r.rating} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(r.createdAt)}
              </p>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              <Separator className="mt-1 hidden" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
