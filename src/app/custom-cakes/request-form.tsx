"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { submitCakeRequest } from "./actions";
import { FieldError, FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CAKE_SIZES } from "@/lib/cake-requests";

export function CakeRequestForm({
  uploadsEnabled,
  minDate,
  maxDate,
}: {
  uploadsEnabled: boolean;
  minDate: string;
  maxDate: string;
}) {
  const [state, action, pending] = useActionState(submitCakeRequest, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Request sent! We'll get back to you with a quote.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        <form ref={formRef} action={action} className="flex flex-col gap-4">
          <FormError message={state?.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                name="occasion"
                placeholder="Birthday, anniversary…"
                required
              />
              <FieldError errors={state?.fieldErrors?.occasion} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sizeLabel">Size</Label>
              <select
                id="sizeLabel"
                name="sizeLabel"
                required
                defaultValue="1 kg"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {CAKE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="flavour">Flavour</Label>
              <Input
                id="flavour"
                name="flavour"
                placeholder="Chocolate, red velvet, rasmalai…"
                required
              />
              <FieldError errors={state?.fieldErrors?.flavour} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="neededByDate">Needed by</Label>
              <Input
                id="neededByDate"
                name="neededByDate"
                type="date"
                min={minDate}
                max={maxDate}
                required
              />
              <FieldError errors={state?.fieldErrors?.neededByDate} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cakeMessage">Message on the cake (optional)</Label>
            <Input
              id="cakeMessage"
              name="cakeMessage"
              maxLength={60}
              placeholder="Happy Birthday Aarav!"
            />
            <FieldError errors={state?.fieldErrors?.cakeMessage} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="referenceImage">
              Reference image (optional{uploadsEnabled ? ", max 5MB" : ""})
            </Label>
            {uploadsEnabled ? (
              <Input
                id="referenceImage"
                name="referenceImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
              />
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Image uploads will be enabled once Cloudinary is connected.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="instructions">Special instructions (optional)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={3}
              maxLength={1000}
              placeholder="Theme, colours, allergies, dietary needs…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isEggless"
              value="true"
              className="size-4 accent-primary"
            />
            Make it eggless
          </label>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Sending…" : "Send request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
