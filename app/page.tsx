export default function Home() {
  return (
    <main style={styles.wrapper}>
      <div style={styles.container}>
        <p style={styles.kicker}>🔥 Where’s My Lighter</p>

        <h1 style={styles.title}>
          Track a lighter&apos;s journey.
          <br />
          One tap at a time.
        </h1>

        <p style={styles.subtitle}>
          Tap the NFC lighter to log the moment. See the last known location,
          recent taps, and the <em>tamagotchi-style</em> lighter profile evolve
          over time.
        </p>

        <div style={styles.buttons}>
          <a href="/lighter/demo" style={styles.primaryBtn}>
            Open demo lighter →
          </a>

          <button
            style={styles.secondaryBtn}
            onClick={() =>
              navigator.share?.({
                title: "Where’s My Lighter",
                text: "Track a lighter’s journey, one tap at a time",
                url: window.location.href,
              })
            }
          >
            Share with partners
          </button>
        </div>

        <p style={styles.tip}>
          Tip: Your NFC tag should point to{" "}
          <code>/lighter/&lt;ID&gt;</code>
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 800px at 10% 10%, #3b1c5a, #09040f 60%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "#fff",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif",
  },

  container: {
    maxWidth: "420px",
    width: "100%",
  },

  kicker: {
    opacity: 0.85,
    fontSize: "14px",
    marginBottom: "16px",
  },

  title: {
    fontSize: "42px",
    lineHeight: "1.1",
    fontWeight: 800,
    marginBottom: "20px",
  },

  subtitle: {
    fontSize: "16px",
    lineHeight: "1.6",
    opacity: 0.9,
    marginBottom: "32px",
  },

  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "24px",
  },

  primaryBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "14px 18px",
    borderRadius: "14px",
    fontSize: "16px",
    color: "#fff",
    textDecoration: "none",
    textAlign: "center",
    backdropFilter: "blur(6px)",
  },

  secondaryBtn: {
    background: "linear-gradient(135deg, #3a200f, #6b3a1c)",
    border: "none",
    padding: "14px 18px",
    borderRadius: "14px",
    fontSize: "16px",
    color: "#fff",
    cursor: "pointer",
  },

  tip: {
    fontSize: "13px",
    opacity: 0.6,
  },
};
