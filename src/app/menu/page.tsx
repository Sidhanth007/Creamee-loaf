import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse our fresh-baked cakes, cupcakes, cookies, brownies and breads.",
};

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const categorySlug = typeof params.category === "string" ? params.category : "";

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  const products = await db.product.findMany({
    where: {
      category: { isActive: true, ...(categorySlug ? { slug: categorySlug } : {}) },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isAvailable: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      unitLabel: true,
      imageUrl: true,
      isEggless: true,
      isAvailable: true,
    },
  });

  const ratings = await db.review.groupBy({
    by: ["productId"],
    where: { isApproved: true, productId: { in: products.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingByProduct = new Map(
    ratings.map((r) => [r.productId, { avg: r._avg.rating, count: r._count.rating }])
  );

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          {activeCategory ? activeCategory.name : "Our menu"}
        </h1>
        <p className="text-muted-foreground">
          Everything is baked fresh to order — pick your favourites.
        </p>
      </div>

      <form action="/menu" method="get" className="mt-6 flex max-w-md gap-2">
        {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search cakes, cookies…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <CategoryChip href={q ? `/menu?q=${encodeURIComponent(q)}` : "/menu"} active={!categorySlug}>
          All
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip
            key={c.slug}
            href={`/menu?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={c.slug === categorySlug}
          >
            {c.name}
          </CategoryChip>
        ))}
      </div>

      {q && (
        <p className="mt-6 text-sm text-muted-foreground">
          {products.length} result{products.length === 1 ? "" : "s"} for{" "}
          <Badge variant="secondary">{q}</Badge>{" "}
          <Link href={categorySlug ? `/menu?category=${categorySlug}` : "/menu"} className="text-primary hover:underline">
            Clear search
          </Link>
        </p>
      )}

      {products.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="font-heading text-xl">Nothing found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or browse another category.
          </p>
          <Button variant="outline" className="mt-2" render={<Link href="/menu" />}>
            View full menu
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                ...p,
                avgRating: ratingByProduct.get(p.id)?.avg ?? null,
                reviewCount: ratingByProduct.get(p.id)?.count ?? 0,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card hover:bg-muted"
      )}
    >
      {children}
    </Link>
  );
}
