"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile } from "./actions";
import { FieldError, FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) toast.success("Profile updated");
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Profile</CardTitle>
        <CardDescription>Your name and contact number.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" name="name" defaultValue={name} required />
            <FieldError errors={state?.fieldErrors?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-phone">Phone (optional)</Label>
            <Input
              id="profile-phone"
              name="phone"
              type="tel"
              defaultValue={phone}
              placeholder="e.g. 98765 43210"
            />
            <FieldError errors={state?.fieldErrors?.phone} />
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
