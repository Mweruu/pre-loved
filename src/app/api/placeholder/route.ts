import { NextResponse, type NextRequest } from "next/server";

/**
 * Generates pleasant placeholder artwork for demo/seed listings.
 * Usage: /api/placeholder?e=🛋️&t=3-Seat%20Sofa&v=2
 */

const PALETTES: [string, string][] = [
  ["#f6f1e7", "#e7dccb"],
  ["#eef2ea", "#d8e2d0"],
  ["#f4ede4", "#eadbc4"],
  ["#eaf0ee", "#d5e0da"],
  ["#f6efe9", "#e8d9c6"],
  ["#edf0e8", "#dde1cd"],
  ["#f2f1e6", "#e2ddc8"],
  ["#e9efe9", "#d3ddd3"],
  ["#f5ece2", "#e9d8c7"],
];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const emoji = (params.get("e") ?? "🏠").slice(0, 12);
  const title = (params.get("t") ?? "Household item").slice(0, 42);
  const variant = params.get("v") ?? "1";

  const [from, to] = PALETTES[hash(`${emoji}${title}${variant}`) % PALETTES.length];

  const truncated =
    title.length > 34 ? `${title.slice(0, 33)}…` : escapeXml(title);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="700" fill="url(#g)"/>
  <circle cx="450" cy="315" r="205" fill="rgba(255,255,255,0.55)"/>
  <circle cx="450" cy="315" r="252" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
  <text x="450" y="392" text-anchor="middle" font-size="185" font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${emoji}</text>
  <text x="450" y="600" text-anchor="middle" font-family="'Inter','Segoe UI',sans-serif" font-size="34" font-weight="600" fill="#383632">${truncated}</text>
  <text x="64" y="72" font-family="'Inter','Segoe UI',sans-serif" font-size="19" letter-spacing="5" font-weight="700" fill="#a8762d">SOKONI NYUMBANI</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
