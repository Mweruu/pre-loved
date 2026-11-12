"use client";

import { useState } from "react";
import { Share2, CircleCheck } from "lucide-react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const shareData = { title, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall back to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button onClick={share} className="btn-secondary btn-md flex-1">
      {copied ? (
        <>
          <CircleCheck className="h-4 w-4 text-forest-600" aria-hidden="true" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </>
      )}
    </button>
  );
}
