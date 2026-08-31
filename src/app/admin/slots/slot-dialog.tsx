"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { saveSlot, type AdminFormState } from "../actions";
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

export type SlotFormData = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  sortOrder: number;
  isActive: boolean;
};

export function SlotDialog({
  slot,
  trigger,
}: {
  slot?: SlotFormData;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await saveSlot(prev, formData);
      if (result?.success) {
        toast.success("Slot saved");
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
            {slot ? "Edit delivery slot" : "New delivery slot"}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {slot && <input type="hidden" name="slotId" value={slot.id} />}
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="s-label">Label</Label>
            <Input
              id="s-label"
              name="label"
              placeholder="Morning"
              defaultValue={slot?.label}
              required
            />
            <FieldError errors={state?.fieldErrors?.label} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="s-start">Start time</Label>
              <Input
                id="s-start"
                name="startTime"
                type="time"
                defaultValue={slot?.startTime}
                required
              />
              <FieldError errors={state?.fieldErrors?.startTime} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="s-end">End time</Label>
              <Input
                id="s-end"
                name="endTime"
                type="time"
                defaultValue={slot?.endTime}
                required
              />
              <FieldError errors={state?.fieldErrors?.endTime} />
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="s-cap">Capacity (orders/day)</Label>
              <Input
                id="s-cap"
                name="capacity"
                type="number"
                min="1"
                defaultValue={slot?.capacity ?? 10}
              />
              <FieldError errors={state?.fieldErrors?.capacity} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="s-sort">Sort order</Label>
              <Input
                id="s-sort"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={slot?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={slot?.isActive ?? true}
              className="size-4 accent-primary"
            />
            Offered at checkout
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save slot"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
