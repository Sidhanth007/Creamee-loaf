import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "./product-image";
import { formatPrice } from "@/lib/site";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  unitLabel: string;
  imageUrl: string | null;
  isEggless: boolean;
  isAvailable: boolean;
  avgRating?: number | null;
  reviewCount?: number;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/menu/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
    >
      <div className="relative aspect-square overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="secondary" className="text-sm">
              Sold out
            </Badge>
          </div>
        )}
        {product.isEggless && (
          <Badge className="absolute top-2 left-2 border-green-700/20 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
            Eggless
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{product.unitLabel}</span>
          {product.avgRating != null && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {product.avgRating.toFixed(1)}
              {product.reviewCount ? ` (${product.reviewCount})` : ""}
            </span>
          )}
        </div>
        <p className="mt-auto pt-2 font-heading text-lg font-semibold">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
