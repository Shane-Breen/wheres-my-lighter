export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function LighterPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await supabase
    .from("taps")
    .insert({ lighter_id: params.id })
    .select()
    .single();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>🔥 Where’s My Lighter?</h1>

      <p>
        <b>Lighter ID:</b> {params.id}
      </p>

      {error ? (
        <>
          <p style={{ color: "crimson" }}>
            <b>Supabase insert FAILED:</b>
          </p>
          <pre
            style={{
              background: "#f6f6f6",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
        </>
      ) : (
        <>
          <p>
            <b>✅ Tap inserted into database.</b>
          </p>
          <pre
            style={{
              background: "#f6f6f6",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/">← Back home</a>
      </p>
    </main>
  );
}
