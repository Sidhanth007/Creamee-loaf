"use client";

import { useActionState, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "./review-actions";
import { FieldError, FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing?: { rating: number; comment: string };
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState(submitReview, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Review submitted — it will appear once approved.");
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <FormError message={state?.error} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                i <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
      <FieldError errors={state?.fieldErrors?.rating} />
      <Textarea
        name="comment"
        rows={3}
        maxLength={500}
        defaultValue={existing?.comment}
        placeholder="How was it? (optional)"
      />
      <FieldError errors={state?.fieldErrors?.comment} />
      <Button type="submit" disabled={pending || rating === 0} className="self-start">
        {pending ? "Submitting…" : existing ? "Update review" : "Submit review"}
      </Button>
    </form>
  );
}
