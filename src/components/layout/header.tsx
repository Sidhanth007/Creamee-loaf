import Link from "next/link";
import { LogOut, ShoppingBag, UserRound } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";

export async function Header() {
  const user = await getCurrentUser();
  const cartCount = user
    ? await db.cartItem
        .aggregate({ where: { userId: user.id }, _sum: { quantity: true } })
        .then((r) => r._sum.quantity ?? 0)
    : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="font-heading text-lg font-semibold whitespace-nowrap sm:text-xl"
          >
            {site.name}
          </Link>
          <Link
            href="/menu"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Menu
          </Link>
          <Link
            href="/custom-cakes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground max-sm:hidden"
          >
            Custom cakes
          </Link>
          {user && (
            <Link
              href="/orders"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="max-sm:hidden">My orders</span>
              <span className="sm:hidden">Orders</span>
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Admin
            </Link>
          )}
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                render={<Link href="/cart" aria-label="Cart" />}
              >
                <ShoppingBag />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {cartCount > 99 ? "99" : cartCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" render={<Link href="/account" />}>
                <UserRound data-icon="inline-start" />
                <span className="max-sm:hidden">{user.name.split(" ")[0]}</span>
              </Button>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  aria-label="Sign out"
                >
                  <LogOut data-icon="inline-start" />
                  <span className="max-sm:hidden">Sign out</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                <span className="max-sm:hidden">Create account</span>
                <span className="sm:hidden">Sign up</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
