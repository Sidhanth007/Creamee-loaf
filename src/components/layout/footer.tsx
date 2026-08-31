import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="font-heading text-base font-semibold text-foreground">
          {site.name}
        </p>
        <p>
          © {new Date().getFullYear()} {site.name} · {site.contactEmail}
        </p>
        <p className="text-xs">
          Demo project — payments run in test mode, no real orders are fulfilled.
        </p>
      </div>
    </footer>
  );
}
