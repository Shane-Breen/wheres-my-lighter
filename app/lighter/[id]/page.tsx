"use client";

import { useMemo } from "react";

export default function LighterPage({ params }: any) {
  const id = params?.id as string;

  const nfcUrl = useMemo(() => {
    if (typeof window === "undefined") return `/lighter/${id}`;
    return `${window.location.origin}/lighter/${id}`;
  }, [id]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui",
        background:
          "radial-gradient(1200px 600px at 20% 20%, rgba(140,80,255,0.35), transparent 60%), radial-gradient(1200px 600px at 90% 10%, rgba(255,140,80,0.25), transparent 55%), #0b0b10",
        color: "white",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 10 }}>
          🔥 Where’s My Lighter
        </div>

        <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "0 0 10px 0" }}>
          Lighter Profile
        </h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>Lighter ID</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{id}</div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(id)}
            style={{
              cursor: "pointer",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 700,
            }}
          >
            Copy ID
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(nfcUrl)}
            style={{
              cursor: "pointer",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,140,80,0.35)",
              background: "rgba(255,140,80,0.12)",
              color: "white",
              fontWeight: 700,
            }}
          >
            Copy NFC URL
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <section
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>Status</h2>
            <p style={{ margin: "8px 0 0 0", opacity: 0.85 }}>
              Last seen: <b>unknown (we’ll wire Supabase next)</b>
            </p>
          </section>

          <section
            style={{
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>Recent taps</h2>
            <p style={{ margin: "8px 0 0 0", opacity: 0.8 }}>
              No taps loaded yet.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
          NFC tip: program the tag to open <b>/lighter/{id}</b>
        </div>
      </div>
    </main>
  );
}
