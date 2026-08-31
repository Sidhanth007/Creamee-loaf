// Single source of truth for branding — change these values to rebrand the whole site.
export const site = {
  name: "Creameè & Loaf",
  tagline: "Baked fresh at home, delivered with love",
  description:
    "A home bakery crafting fresh cakes, cookies, breads and custom celebration cakes. Order online for home delivery.",
  currency: "INR",
  currencySymbol: "₹",
  locale: "en-IN",
  contactEmail: "hello@creameeandloaf.example",
  // Delivery pricing (in paise)
  deliveryFee: 4900,
  freeDeliveryAbove: 99900,
} as const;

export function formatPrice(amountInPaise: number): string {
  return new Intl.NumberFormat(site.locale, {
    style: "currency",
    currency: site.currency,
    maximumFractionDigits: 0,
  }).format(amountInPaise / 100);
}
