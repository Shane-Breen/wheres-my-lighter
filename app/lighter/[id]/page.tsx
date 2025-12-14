export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LighterPage({ params }: PageProps) {
  const { id } = await params;

  // 1) Read the most recent tap BEFORE we insert this new one
  const { data: lastTap, error: lastTapError } = await supabase
    .from("taps")
    .select("lighter_id, tapped_at")
    .eq("lighter_id", id)
    .order("tapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2) Insert the new tap (this visit)
  const { error: insertError } = await supabase.from("taps").insert({
    lighter_id: id,
  });

  return (
    <main style={{ padding: 40 }}>
      <h1>🔥 Where’s My Lighter?</h1>

      <p>
        <b>Lighter ID:</b> {id}
      </p>

      <hr style={{ margin: "24px 0" }} />

      <h2 style={{ marginBottom: 8 }}>Last tap (before you)</h2>

      {lastTapError ? (
        <>
          <p style={{ color: "crimson" }}>
            <b>Failed to load last tap:</b>
          </p>
          <pre>{JSON.stringify(lastTapError, null, 2)}</pre>
        </>
      ) : lastTap ? (
        <p>
          <b>Last seen:</b>{" "}
          {new Date(lastTap.tapped_at).toLocaleString()}
        </p>
      ) : (
        <p>
          No previous taps yet — you’re the first.
        </p>
      )}

      <hr style={{ margin: "24px 0" }} />

      {insertError ? (
        <>
          <p style={{ color: "crimson" }}>
            <b>Tap insert FAILED:</b>
          </p>
          <pre>{JSON.stringify(insertError, null, 2)}</pre>
        </>
      ) : (
        <p>
          <b>✅ Your tap was recorded.</b>
        </p>
      )}
    </main>
  );
}
