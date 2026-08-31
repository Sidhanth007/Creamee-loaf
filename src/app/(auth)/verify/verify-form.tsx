"use client";

import { useActionState } from "react";
import { resendCode, verifyEmail } from "../actions";
import { FormError } from "@/components/auth/form-error";
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

export function VerifyForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(verifyEmail, null);
  const [resendState, resendAction, resendPending] = useActionState(resendCode, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Check your inbox</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
          It expires in 10 minutes.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <CardContent className="flex flex-col gap-4">
          <FormError message={state?.error} />
          {resendState?.message ? (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
              {resendState.message}
            </p>
          ) : (
            <FormError message={resendState?.error} />
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
              className="text-center text-2xl tracking-[0.5em]"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Verifying…" : "Verify email"}
          </Button>
        </CardFooter>
      </form>
      <form action={resendAction} className="px-6 pb-6">
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="ghost"
          className="w-full"
          disabled={resendPending}
        >
          {resendPending ? "Sending…" : "Resend code"}
        </Button>
      </form>
    </Card>
  );
}
