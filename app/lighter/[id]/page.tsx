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
  const { error } = await supabase.from("taps").insert({
    lighter_id: params.id,
  });

  return (
    <main style={{ padding: 40 }}>
      <h1>🔥 Where’s My Lighter?</h1>
      <p><b>Lighter ID:</b> {params.id}</p>

      {error ? (
        <>
          <p style={{ color: "crimson" }}><b>Supabase insert FAILED:</b></p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </>
      ) : (
        <p><b>✅ Tap inserted into database.</b></p>
      )}
    </main>
  );
}
