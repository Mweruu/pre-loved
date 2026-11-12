"use client";

import { COUNTIES } from "@/lib/constants";

/** County picker used by the homepage "Items near you" section. */
export function NearYouSelect({ value }: { value: string }) {
  return (
    <form method="get" action="/" className="flex items-center gap-2">
      <label htmlFor="near-county" className="sr-only">
        Choose your county
      </label>
      <select
        id="near-county"
        name="near"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="input w-auto min-w-[11rem] text-sm"
      >
        {COUNTIES.map((county) => (
          <option key={county} value={county}>
            {county}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-secondary btn-sm">
        Show
      </button>
    </form>
  );
}
