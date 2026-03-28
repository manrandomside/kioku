import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kioku — Platform Belajar Kosakata Bahasa Jepang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A3A3A",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background kanji decorations */}
        <div
          style={{
            position: "absolute",
            top: -30,
            right: 80,
            fontSize: 280,
            fontWeight: 700,
            color: "rgba(255,255,255,0.04)",
            lineHeight: 1,
          }}
        >
          記
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: 40,
            fontSize: 220,
            fontWeight: 700,
            color: "rgba(255,255,255,0.03)",
            lineHeight: 1,
          }}
        >
          憶
        </div>
        <div
          style={{
            position: "absolute",
            top: 120,
            right: -20,
            fontSize: 180,
            fontWeight: 700,
            color: "rgba(194,233,89,0.04)",
            lineHeight: 1,
          }}
        >
          語
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "60px 80px",
          }}
        >
          {/* Left side */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              kioku
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#C2E959",
                lineHeight: 1,
              }}
            >
              記憶
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.3,
                marginTop: 12,
                maxWidth: 500,
              }}
            >
              Platform Belajar Kosakata
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.3,
              }}
            >
              Bahasa Jepang
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.4,
                marginTop: 4,
              }}
            >
              Gratis untuk Penutur Indonesia
            </div>
          </div>

          {/* Right side — badges */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: 50,
                backgroundColor: "rgba(194,233,89,0.15)",
                color: "#C2E959",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              2.900+ Kosakata
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: 50,
                backgroundColor: "#248288",
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              JLPT N5 & N4
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 28px",
                borderRadius: 50,
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              AI Tutor + FSRS
            </div>
          </div>
        </div>

        {/* Bottom lime border */}
        <div
          style={{
            width: "100%",
            height: 4,
            backgroundColor: "#C2E959",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
