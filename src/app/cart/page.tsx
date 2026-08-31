import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { removeCartItem, setCartItemQuantity } from "./actions";
import { ProductImage } from "@/components/products/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, site } from "@/lib/site";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await db.cartItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          slug: true,
          name: true,
          price: true,
          unitLabel: true,
          imageUrl: true,
          isAvailable: true,
        },
      },
    },
  });

  const availableItems = items.filter((i) => i.product.isAvailable);
  const subtotal = availableItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const deliveryFee =
    subtotal === 0 || subtotal >= site.freeDeliveryAbove ? 0 : site.deliveryFee;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <ShoppingBag className="size-12 text-muted-foreground/40" />
        <h1 className="font-heading text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground">
          Fresh bakes are waiting — go pick your favourites.
        </p>
        <Button render={<Link href="/menu" />}>Browse the menu</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border bg-card p-4"
            >
              <Link
                href={`/menu/${item.product.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-lg border"
              >
                <ProductImage
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  sizes="96px"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/menu/${item.product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.product.unitLabel}
                    </p>
                    {!item.product.isAvailable && (
                      <Badge variant="destructive" className="mt-1">
                        Sold out — not included in total
                      </Badge>
                    )}
                  </div>
                  <form action={removeCartItem}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.product.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </form>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border">
                    <form action={setCartItemQuantity}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity - 1} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Decrease quantity"
                      >
                        <Minus />
                      </Button>
                    </form>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <form action={setCartItemQuantity}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity + 1} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= 20}
                      >
                        <Plus />
                      </Button>
                    </form>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-3 p-6">
            <h2 className="font-heading text-lg font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-muted-foreground">
                Free delivery on orders above {formatPrice(site.freeDeliveryAbove)}.
              </p>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatPrice(total)}</span>
            </div>
            <Button
              size="lg"
              className="mt-2"
              disabled={availableItems.length === 0}
              render={<Link href="/checkout" />}
            >
              Proceed to checkout
            </Button>
            <Button variant="ghost" render={<Link href="/menu" />}>
              Continue shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
