import { ShieldAlert } from "lucide-react";

import { BUYER_SAFETY_NOTICE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The platform's buyer/seller safety notice.
 * Rendered on the homepage, product pages and contact-seller flows.
 */
export function SafetyNotice({
  text = BUYER_SAFETY_NOTICE,
  className,
  compact = false,
  title = "IMPORTANT: BUYER SAFETY NOTICE",
}: {
  text?: string;
  className?: string;
  compact?: boolean;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gold-300 bg-gold-50 p-5",
        className
      )}
      role="note"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-bold uppercase tracking-wide text-gold-900">
          {title}
        </p>
      </div>
      <div
        className={cn(
          "prose-block mt-3 text-ink-700",
          compact && "line-clamp-4"
        )}
      >
        {text}
      </div>
      {compact && (
        <a
          href="/safety"
          className="mt-2 inline-block text-xs font-semibold text-gold-800 underline underline-offset-2 hover:text-gold-900"
        >
          Read the full safety guide →
        </a>
      )}
    </div>
  );
}
