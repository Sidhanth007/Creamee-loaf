"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { placeOrder, verifyPayment, type PlaceOrderState } from "./actions";
import { FormError } from "@/components/auth/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, site } from "@/lib/site";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  addresses: {
    id: string;
    label: string;
    summary: string;
    phone: string;
    isDefault: boolean;
  }[];
  slots: { id: string; label: string }[];
  items: {
    id: string;
    name: string;
    unitLabel: string;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  liveGateway: boolean;
  minDate: string;
  maxDate: string;
};

export function CheckoutForm({
  addresses,
  slots,
  items,
  subtotal,
  deliveryFee,
  liveGateway,
  minDate,
  maxDate,
}: Props) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!liveGateway) return;
    if (document.getElementById("razorpay-js")) return;
    const script = document.createElement("script");
    script.id = "razorpay-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, [liveGateway]);

  function openRazorpay(payment: NonNullable<PlaceOrderState>["payment"]) {
    if (!payment) return;
    if (!window.Razorpay) {
      toast.error("Payment script did not load. Please refresh and try again.");
      return;
    }
    setPaying(true);
    const rzp = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.razorpayOrderId,
      name: site.name,
      description: `Order ${payment.orderNumber}`,
      amount: payment.amount,
      currency: "INR",
      prefill: {
        name: payment.name,
        email: payment.email,
        contact: payment.contact,
      },
      theme: { color: "#8a5a2b" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const result = await verifyPayment({
          orderId: payment.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (result.ok) {
          router.push(`/checkout/success?order=${result.orderNumber}`);
        } else {
          setPaying(false);
          toast.error(result.error ?? "Payment verification failed.");
        }
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
          toast.info("Payment cancelled — your order was not placed.");
        },
      },
    });
    rzp.open();
  }

  const [state, action, pending] = useActionState(
    async (prev: PlaceOrderState, formData: FormData) => {
      const result = await placeOrder(prev, formData);
      if (result?.payment) openRazorpay(result.payment);
      return result;
    },
    null
  );

  return (
    <form action={action} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-8">
        <FormError message={state?.error} />

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">
            1 · Delivery address
          </h2>
          <div className="flex flex-col gap-2">
            {addresses.map((a, idx) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  type="radio"
                  name="addressId"
                  value={a.id}
                  defaultChecked={a.isDefault || (idx === 0 && !addresses.some((x) => x.isDefault))}
                  className="mt-1 accent-primary"
                  required
                />
                <span className="text-sm">
                  <span className="font-medium">
                    {a.label}{" "}
                    {a.isDefault && (
                      <Badge variant="secondary" className="ml-1">
                        Default
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {a.summary} · ☎ {a.phone}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">
            2 · Delivery date &amp; time
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryDate">Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                name="deliveryDate"
                min={minDate}
                max={maxDate}
                defaultValue={minDate}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slotId">Time slot</Label>
              <select
                id="slotId"
                name="slotId"
                required
                defaultValue=""
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>
                  Choose a slot
                </option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">
            3 · Note for the baker (optional)
          </h2>
          <Textarea
            name="note"
            placeholder="Allergies, delivery instructions, a message…"
            maxLength={500}
          />
        </section>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardContent className="flex flex-col gap-3 p-6">
          <h2 className="font-heading text-lg font-semibold">Your order</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.name} × {i.quantity}
                </span>
                <span className="shrink-0">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="font-heading text-lg">{formatPrice(total)}</span>
          </div>
          <Button type="submit" size="lg" className="mt-2" disabled={pending || paying}>
            {pending || paying
              ? "Processing…"
              : liveGateway
                ? `Pay ${formatPrice(total)} (test mode)`
                : `Place order — demo payment`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {liveGateway
              ? "Razorpay sandbox — no real money moves."
              : "Demo mode: payment is simulated until gateway keys are added."}
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
