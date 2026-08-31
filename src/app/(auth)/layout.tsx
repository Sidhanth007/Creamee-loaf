import Link from "next/link";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-center">
        <span className="font-heading text-3xl font-semibold">{site.name}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
