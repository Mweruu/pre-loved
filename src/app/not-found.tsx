import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-600">
        <PackageSearch className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink-900">
        This page has moved on
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-600">
        The page you&apos;re looking for doesn&apos;t exist — or the listing
        was sold, expired or removed by its seller.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/marketplace" className="btn-primary btn-lg">
          Browse the marketplace
        </Link>
        <Link href="/" className="btn-secondary btn-lg">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
