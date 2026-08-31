"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { changePassword, type AccountFormState } from "./actions";
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

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: AccountFormState, formData: FormData) => {
      const result = await changePassword(prev, formData);
      if (result?.success) {
        toast.success("Password changed");
        formRef.current?.reset();
      }
      return result;
    },
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Change password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <form ref={formRef} action={action}>
        <CardContent className="flex flex-col gap-4">
          <FormError message={state?.error} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
            <FieldError errors={state?.fieldErrors?.currentPassword} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <FieldError errors={state?.fieldErrors?.newPassword} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldError errors={state?.fieldErrors?.confirmPassword} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
