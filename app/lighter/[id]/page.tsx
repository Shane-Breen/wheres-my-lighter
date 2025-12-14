"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function LighterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params?.id;

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [status, setStatus] = useState<
    "idle" | "inserting" | "success" | "error"
  >("idle");
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function run() {
      setStatus("inserting");
      setErrorText("");

      const { error } = await supabase.from("taps").insert({
        lighter_id: id,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setErrorText(JSON.stringify(error, null, 2));
      } else {
        setStatus("success");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, -apple-system" }}>
      <h1 style={{ fontSize: 44, marginBottom: 12 }}>🔥 Where’s My Lighter?</h1>

      <p style={{ fontSize: 22 }}>
        <b>Lighter ID:</b> {id ?? "(loading...)"}
      </p>

      <div style={{ marginTop: 20 }}>
        {status === "idle" && <p>Loading…</p>}
        {status === "inserting" && <p>Recording tap…</p>}
        {status === "success" && <p><b>✅ Tap inserted into database.</b></p>}
        {status === "error" && (
          <>
            <p style={{ color: "crimson" }}>
              <b>❌ Supabase insert FAILED:</b>
            </p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{errorText}</pre>
          </>
        )}
      </div>

      <p style={{ marginTop: 30 }}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            router.push("/");
          }}
        >
          ← Back home
        </a>
      </p>
    </main>
  );
}
