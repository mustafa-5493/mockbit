import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=31536000, immutable",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const PALETTES = [
  { bg: "#3b82f6", fg: "#ffffff" },
  { bg: "#10b981", fg: "#ffffff" },
  { bg: "#6366f1", fg: "#ffffff" },
  { bg: "#8b5cf6", fg: "#ffffff" },
  { bg: "#ec4899", fg: "#ffffff" },
  { bg: "#f59e0b", fg: "#ffffff" },
  { bg: "#06b6d4", fg: "#ffffff" },
];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const url = new URL(req.url);
  const size = Math.min(Math.max(parseInt(url.searchParams.get("size") || "128", 10), 32), 512);

  // Deterministic seed hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = PALETTES[Math.abs(hash) % PALETTES.length];
  const initials = name.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${palette.bg}" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${palette.fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${Math.floor(size / 2.5)}px" font-weight="700">
    ${initials}
  </text>
</svg>`;

  return new NextResponse(svg, { status: 200, headers: CORS_HEADERS });
}
