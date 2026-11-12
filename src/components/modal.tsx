"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Dialog"}
    >
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "card relative z-10 max-h-[92vh] w-full overflow-y-auto p-6 shadow-lift",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {title && (
            <h2 className="font-display text-lg font-semibold text-ink-900">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-500 hover:bg-sand-100 hover:text-ink-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className={title ? "mt-4" : ""}>{children}</div>
      </div>
    </div>
  );
}
