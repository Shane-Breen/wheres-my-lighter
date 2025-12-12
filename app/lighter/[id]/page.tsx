export default function LighterPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: 24 }}>
      <h1>🔥 Where’s My Lighter?</h1>
      <p>
        Lighter ID: <b>{params.id}</b>
      </p>
      <p>This lighter has been tapped.</p>

      <p>
        <a href="/">← Back home</a>
      </p>
    </main>
  );
}
