import Link from "next/link";
import { BrandDisclosure } from "./BrandDisclosure";

export function MarketingFooter() {
  const year = 2026;
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-slate-700">MathPivot</div>
          <BrandDisclosure />
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <Link href="/pricing" className="hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-slate-900">
            About
          </Link>
          <Link href="/partnerships" className="hover:text-slate-900">
            Partnerships
          </Link>
          <Link href="/careers" className="hover:text-slate-900">
            Careers
          </Link>
          <Link href="/get-started" className="hover:text-slate-900">
            Get Started
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-slate-500">
          &copy; {year} Mpingo Systems, LLC. MathPivot is a service of Mpingo
          Systems, LLC.
        </div>
      </div>
    </footer>
  );
}
