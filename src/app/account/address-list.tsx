"use client";

import { useActionState, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  type AccountFormState,
} from "./actions";
import { FieldError, FormError } from "@/components/auth/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddressData = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

function AddressDialog({
  address,
  trigger,
  title,
}: {
  address?: AddressData;
  trigger: React.ReactElement;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: AccountFormState, formData: FormData) => {
      const result = await saveAddress(prev, formData);
      if (result?.success) {
        toast.success("Address saved");
        setOpen(false);
      }
      return result;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {address && <input type="hidden" name="addressId" value={address.id} />}
          <FormError message={state?.error} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                name="label"
                placeholder="Home / Work"
                defaultValue={address?.label ?? "Home"}
                required
              />
              <FieldError errors={state?.fieldErrors?.label} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="addr-phone">Phone</Label>
              <Input
                id="addr-phone"
                name="phone"
                type="tel"
                defaultValue={address?.phone}
                required
              />
              <FieldError errors={state?.fieldErrors?.phone} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="line1">Address line 1</Label>
            <Input
              id="line1"
              name="line1"
              placeholder="House / flat, street"
              defaultValue={address?.line1}
              required
            />
            <FieldError errors={state?.fieldErrors?.line1} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="line2">Address line 2 (optional)</Label>
            <Input
              id="line2"
              name="line2"
              placeholder="Landmark, area"
              defaultValue={address?.line2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={address?.city} required />
              <FieldError errors={state?.fieldErrors?.city} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={address?.state} required />
              <FieldError errors={state?.fieldErrors?.state} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pincode">PIN code</Label>
              <Input
                id="pincode"
                name="pincode"
                inputMode="numeric"
                maxLength={6}
                defaultValue={address?.pincode}
                required
              />
              <FieldError errors={state?.fieldErrors?.pincode} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isDefault"
              value="true"
              defaultChecked={address?.isDefault}
              className="size-4 accent-primary"
            />
            Use as my default delivery address
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save address"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddressList({ addresses }: { addresses: AddressData[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="font-heading text-xl">Delivery addresses</CardTitle>
          <CardDescription>Where should we bring the goodies?</CardDescription>
        </div>
        <AddressDialog
          title="Add address"
          trigger={
            <Button size="sm">
              <Plus data-icon="inline-start" /> Add address
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {addresses.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No addresses yet. Add one to speed up checkout.
          </p>
        )}
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-medium">
                  {a.label}{" "}
                  {a.isDefault && (
                    <Badge variant="secondary" className="ml-1">
                      Default
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                </p>
                <p className="text-muted-foreground">☎ {a.phone}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!a.isDefault && (
                <form action={setDefaultAddress}>
                  <input type="hidden" name="addressId" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Set default
                  </Button>
                </form>
              )}
              <AddressDialog
                title="Edit address"
                address={a}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Edit address">
                    <Pencil />
                  </Button>
                }
              />
              <form action={deleteAddress}>
                <input type="hidden" name="addressId" value={a.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete address"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </form>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
