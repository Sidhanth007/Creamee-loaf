"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { saveProduct, type AdminFormState } from "../actions";
import { FieldError, FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormData = {
  id: string;
  name: string;
  description: string;
  priceRupees: number;
  unitLabel: string;
  categoryId: string;
  imageUrl: string;
  isEggless: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
};

export function ProductDialog({
  product,
  categories,
  trigger,
}: {
  product?: ProductFormData;
  categories: { id: string; name: string }[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await saveProduct(prev, formData);
      if (result?.success) {
        toast.success("Product saved");
        setOpen(false);
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {product ? "Edit product" : "New product"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {product && <input type="hidden" name="productId" value={product.id} />}
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" name="name" defaultValue={product?.name} required />
            <FieldError errors={state?.fieldErrors?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              name="description"
              rows={3}
              defaultValue={product?.description}
              required
            />
            <FieldError errors={state?.fieldErrors?.description} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-price">Price (₹)</Label>
              <Input
                id="p-price"
                name="priceRupees"
                type="number"
                step="0.01"
                min="1"
                defaultValue={product?.priceRupees}
                required
              />
              <FieldError errors={state?.fieldErrors?.priceRupees} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-unit">Unit label</Label>
              <Input
                id="p-unit"
                name="unitLabel"
                placeholder="1 kg / Box of 6"
                defaultValue={product?.unitLabel}
                required
              />
              <FieldError errors={state?.fieldErrors?.unitLabel} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-cat">Category</Label>
            <select
              id="p-cat"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError errors={state?.fieldErrors?.categoryId} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-img">Image URL (optional)</Label>
            <Input
              id="p-img"
              name="imageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={product?.imageUrl}
            />
            <FieldError errors={state?.fieldErrors?.imageUrl} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isAvailable"
                value="true"
                defaultChecked={product?.isAvailable ?? true}
                className="size-4 accent-primary"
              />
              Available
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isEggless"
                value="true"
                defaultChecked={product?.isEggless}
                className="size-4 accent-primary"
              />
              Eggless
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                value="true"
                defaultChecked={product?.isFeatured}
                className="size-4 accent-primary"
              />
              Featured on home page
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
