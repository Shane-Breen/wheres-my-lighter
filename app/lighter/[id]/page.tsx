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
  // 👇 THIS is the whole point
  await supabase.from("taps").insert({
    lighter_id: params.id,
  });

  return (
    <main style={{ padding: 40 }}>
      <h1>Where’s My Lighter</h1>
      <p>Lighter ID:</p>
      <pre>{params.id}</pre>
    </main>
  );
}
