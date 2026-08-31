"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminFormState } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteEntityButton({
  action,
  fieldName,
  fieldValue,
  label,
}: {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  fieldName: string;
  fieldValue: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success("Deleted");
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name={fieldName} value={fieldValue} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        disabled={pending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
