import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) =>
    `${basePath}${query ? `${query}&` : "?"}page=${p}`;

  const window: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) window.push(i);

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary btn-sm">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className="btn-secondary btn-sm cursor-not-allowed opacity-50">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </span>
      )}
      {window.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "btn btn-sm",
            p === page
              ? "bg-forest-700 text-white"
              : "border border-sand-300 bg-white text-ink-700 hover:bg-sand-100"
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn-secondary btn-sm">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn-secondary btn-sm cursor-not-allowed opacity-50">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
