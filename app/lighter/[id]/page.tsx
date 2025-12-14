export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LighterPage({ params }: PageProps) {
  const { id } = await params;

  // 1️⃣ Read the most recent tap BEFORE inserting a new one
  const { data: lastTap, error: lastTapError } = await supabase
    .from("taps")
    .select("*")
    .eq("lighter_id", id)
    .order("tapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2️⃣ Insert the new tap
  const { error: insertError } = await supabase.from("taps").insert({
    lighter_id: id,
  });

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>🔥 Where’s My Lighter?</h1>

      <p>
        <b>Lighter ID:</b> {id}
      </p>

      {lastTap && !lastTapError && (
        <section
          style={{
            marginTop: 24,
            marginBottom: 24,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <h3>Last seen</h3>
          <p>
            This lighter was last tapped on{" "}
            <b>{new Date(lastTap.tapped_at).toLocaleString()}</b>
          </p>
        </section>
      )}

      {insertError ? (
        <>
          <p style={{ color: "crimson" }}>
            <b>Supabase insert FAILED:</b>
          </p>
          <pre>{JSON.stringify(insertError, null, 2)}</pre>
        </>
      ) : (
        <p>
          <b>✅ Tap recorded.</b>
        </p>
      )}
    </main>
  );
}
