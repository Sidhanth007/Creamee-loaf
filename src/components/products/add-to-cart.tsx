"use client";

import { useActionState, useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";

export function AddToCart({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [state, action, pending] = useActionState(addToCart, null);

  useEffect(() => {
    if (state?.success) toast.success("Added to cart");
    if (state?.error) toast.error(state.error);
  }, [state]);

  if (!isAvailable) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto sm:self-start">
        Currently sold out
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex items-center rounded-lg border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Decrease quantity"
          disabled={quantity <= 1}
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          <Minus />
        </Button>
        <span className="w-10 text-center font-medium tabular-nums">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Increase quantity"
          disabled={quantity >= 20}
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
        >
          <Plus />
        </Button>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        <ShoppingBag data-icon="inline-start" />
        {pending ? "Adding…" : "Add to cart"}
      </Button>
    </form>
  );
}
