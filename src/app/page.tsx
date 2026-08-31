import Link from "next/link";
import { ArrowRight, CakeSlice, Clock, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { ProductImage } from "@/components/products/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { site } from "@/lib/site";

const highlights = [
  {
    icon: CakeSlice,
    title: "Baked to order",
    text: "Every cake, cookie and loaf is made fresh in small batches — never off a shelf.",
  },
  {
    icon: Clock,
    title: "Pick your slot",
    text: "Choose a delivery date and time slot that fits your celebration.",
  },
  {
    icon: Truck,
    title: "Home delivered",
    text: "Carefully packed and delivered to your doorstep, ready to serve.",
  },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    db.product.findMany({
      where: { isFeatured: true, isAvailable: true, category: { isActive: true } },
      take: 4,
      orderBy: { name: "asc" },
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
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, description: true, imageUrl: true },
    }),
  ]);

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
        <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
          {site.tagline}
        </Badge>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-7xl">
          {site.name}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
          {site.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/menu" />}>
            Browse the menu
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/custom-cakes" />}>
            Request a custom cake
          </Button>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
              Customer favourites
            </h2>
            <Link
              href="/menu"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">
            Shop by category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/menu?category=${c.slug}`}
                className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ProductImage
                    src={c.imageUrl}
                    alt={c.name}
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="p-3 text-center text-sm font-medium">{c.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-14 sm:grid-cols-3">
        {highlights.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="border-none bg-card/70 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="font-heading text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
