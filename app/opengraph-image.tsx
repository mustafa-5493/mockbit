import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mockbit — Describe your data, get a live API";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#ffffff",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#818cf8",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#6366f1",
            }}
          />
          mockbit.io
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: "800",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "20px",
            background: "linear-gradient(to right, #ffffff, #a5b4fc)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Describe your data, get a live API
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Instant mock endpoints in seconds. AI natural language prompts, JSON samples, or custom schema builder.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
