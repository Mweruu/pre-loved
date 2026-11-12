"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ImageGallery({
  images,
  title,
}: {
  images: { src: string; alt: string }[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sand-200 bg-sand-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].src}
          alt={images[active].alt || title}
          className="h-full w-full object-cover"
        />
        {count > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + count) % count)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-800 shadow-soft transition hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % count)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-800 shadow-soft transition hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active
                  ? "border-forest-600"
                  : "border-transparent hover:border-sand-300"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
