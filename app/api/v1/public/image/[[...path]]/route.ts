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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const url = new URL(req.url);

  let width = 300;
  let height = 200;

  if (path[0] && path[0].includes("x")) {
    const parts = path[0].split("x");
    width = parseInt(parts[0], 10) || 300;
    height = parseInt(parts[1], 10) || 200;
  } else {
    width = parseInt(url.searchParams.get("w") || "300", 10);
    height = parseInt(url.searchParams.get("h") || "200", 10);
  }

  // Cap max dimensions
  width = Math.min(Math.max(width, 10), 2000);
  height = Math.min(Math.max(height, 10), 2000);

  const text = url.searchParams.get("text") || `${width} × ${height}`;
  const bg = url.searchParams.get("bg") ? `#${url.searchParams.get("bg")}` : "#1e293b";
  const fg = url.searchParams.get("fg") ? `#${url.searchParams.get("fg")}` : "#94a3b8";
  const fontSize = Math.min(Math.max(Math.floor(Math.min(width, height) / 8), 12), 48);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}" />
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="${fg}" stroke-opacity="0.2" stroke-width="1" rx="4" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}px" font-weight="600">
    ${escapeXml(text)}
  </text>
</svg>`;

  return new NextResponse(svg, { status: 200, headers: CORS_HEADERS });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
