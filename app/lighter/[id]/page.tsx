export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(900px 500px at 15% 10%, rgba(168,85,247,.28), transparent 60%), radial-gradient(800px 450px at 85% 0%, rgba(249,115,22,.20), transparent 55%), #070712",
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 900, width: "100%" }}>
        <div style={{ opacity: 0.85, fontSize: 14 }}>🔥 Where’s My Lighter</div>

        <h1 style={{ fontSize: 52, lineHeight: 1.05, margin: "10px 0 10px" }}>
          Track a lighter’s journey.
          <br />
          One tap at a time.
        </h1>

        <p style={{ opacity: 0.85, fontSize: 18, maxWidth: 680 }}>
          Tap the NFC lighter to log the moment. See the last known location, recent taps,
          and the “tamagotchi-style” lighter profile evolve over time.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <a
            href="/lighter/test-999"
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.18)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Open demo lighter →
          </a>

          <a
            href="https://wheres-my-lighter.vercel.app"
            style={{
              display: "inline-block",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(249,115,22,.16)",
              border: "1px solid rgba(249,115,22,.28)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Share with partners
          </a>
        </div>

        <div style={{ marginTop: 22, opacity: 0.7, fontSize: 13 }}>
          Tip: Your NFC tag should point to <b>/lighter/&lt;ID&gt;</b>
        </div>
      </div>
    </main>
  );
}
