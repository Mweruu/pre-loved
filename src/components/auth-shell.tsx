import Link from "next/link";
import { Home } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Shared centred card layout for auth pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="container-page flex items-center justify-center py-12 sm:py-16">
      <div className={cn("card w-full max-w-md p-7 sm:p-8", className)}>
        <div className="flex flex-col items-center text-center">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-white shadow-soft"
            aria-label={`${APP_NAME} home`}
          >
            <Home className="h-6 w-6" aria-hidden="true" />
          </Link>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className="mt-7">{children}</div>
        {footer && (
          <div className="mt-6 border-t border-sand-100 pt-5 text-center text-sm text-ink-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
