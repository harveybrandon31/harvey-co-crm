import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Harvey & Co Financial Services";
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
          background: "#2D4A43",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#C9A962",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#2D4A43",
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "white",
            }}
          >
            Harvey & Co<span style={{ color: "#C9A962" }}>.</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "32px",
            color: "#C9A962",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          Financial Services
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.7)",
            marginTop: "40px",
          }}
        >
          Tax Preparation with a Personal Touch
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
