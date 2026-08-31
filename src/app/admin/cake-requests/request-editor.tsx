"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import type { CakeRequestStatus } from "@prisma/client";
import { updateCakeRequest, type AdminFormState } from "../actions";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CAKE_STATUS_LABELS } from "@/lib/cake-requests";

export function RequestEditor({
  requestId,
  status,
  quotedPriceRupees,
  adminNote,
  trigger,
}: {
  requestId: string;
  status: CakeRequestStatus;
  quotedPriceRupees: string;
  adminNote: string;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: AdminFormState, formData: FormData) => {
      const result = await updateCakeRequest(prev, formData);
      if (result?.success) {
        toast.success("Request updated");
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
          <DialogTitle className="font-heading">Update request</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="requestId" value={requestId} />
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="cr-status">Status</Label>
            <select
              id="cr-status"
              name="status"
              defaultValue={status}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {(Object.keys(CAKE_STATUS_LABELS) as CakeRequestStatus[]).map((s) => (
                <option key={s} value={s}>
                  {CAKE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cr-quote">Quote (₹, required when marking Quoted)</Label>
            <Input
              id="cr-quote"
              name="quotedPriceRupees"
              type="number"
              step="0.01"
              min="1"
              defaultValue={quotedPriceRupees}
              placeholder="e.g. 1499"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cr-note">Note to the customer (optional)</Label>
            <Textarea
              id="cr-note"
              name="adminNote"
              rows={3}
              maxLength={500}
              defaultValue={adminNote}
              placeholder="We'd love to make this! The quote covers…"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
