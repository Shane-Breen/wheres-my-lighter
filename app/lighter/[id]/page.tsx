export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Where’s My Lighter</h1>
      <p>Home page is working.</p>

      <p>
        Try:
        {" "}
        <a href="/route-check">/route-check</a>
        {" "}
        and
        {" "}
        <a href="/lighter/test-001">/lighter/test-001</a>
      </p>
    </main>
  );
}
