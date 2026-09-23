import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Og() {
  return new ImageResponse((<div style={{ width: "100%", height: "100%", background: "#12110F", color: "#E7DCC8", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, borderLeft: "16px solid #8E1F2F" }}><div style={{ fontSize: 22, letterSpacing: 8, color: "#B08D57" }}>A2A-X402 ORACLE</div><div style={{ fontSize: 64, marginTop: 18 }}>402 is the answer.</div><div style={{ fontSize: 40, color: "#D4B27A", fontStyle: "italic" }}>The Oracle is how you ask.</div></div>), size);
}
