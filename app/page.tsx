export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Where’s My Lighter?</h1>
      <p>This is the home page.</p>

      <p>
        Test pages:
        {" "}
        <a href="/route-check">/route-check</a>
        {" "}
        •
        {" "}
        <a href="/lighter/test-001">/lighter/test-001</a>
      </p>
    </main>
  );
}
