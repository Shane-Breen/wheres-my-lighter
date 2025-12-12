export default async function LighterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ padding: 24 }}>
      <h1>🔥 Where’s My Lighter?</h1>

      <p>
        Lighter ID: <b>{id}</b>
      </p>

      <p>This lighter has been tapped.</p>

      <p>
        <a href="/">← Back home</a>
      </p>
    </main>
  );
}
