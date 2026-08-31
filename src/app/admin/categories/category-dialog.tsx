"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { saveCategory, type AdminFormState } from "../actions";
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

export type CategoryFormData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: CategoryFormData;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await saveCategory(prev, formData);
      if (result?.success) {
        toast.success("Category saved");
        setOpen(false);
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">
            {category ? "Edit category" : "New category"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {category && (
            <input type="hidden" name="categoryId" value={category.id} />
          )}
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" name="name" defaultValue={category?.name} required />
            <FieldError errors={state?.fieldErrors?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-desc">Description (optional)</Label>
            <Input id="c-desc" name="description" defaultValue={category?.description} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-img">Image URL (optional)</Label>
            <Input
              id="c-img"
              name="imageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={category?.imageUrl}
            />
            <FieldError errors={state?.fieldErrors?.imageUrl} />
          </div>
          <div className="grid grid-cols-2 items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-sort">Sort order</Label>
              <Input
                id="c-sort"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={category?.sortOrder ?? 0}
              />
            </div>
            <label className="flex items-center gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={category?.isActive ?? true}
                className="size-4 accent-primary"
              />
              Visible in store
            </label>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save category"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
