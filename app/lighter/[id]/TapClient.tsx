"use client";

import { useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function TapClient() {
  const supabase = useMemo(() => getSupabase(), []);
  const [status, setStatus] = useState("");

  async function onTap() {
    if (!supabase) {
      setStatus("Demo mode: Supabase not configured yet.");
      return;
    }
    setStatus("Connected ✅ (next: write tap event)");
  }

  return (
    <div className="mt-6">
      <button
        onClick={onTap}
        className="w-full rounded-xl bg-purple-700 py-3 font-semibold text-white"
      >
        Log Tap
      </button>
      {status ? <p className="mt-3 text-sm opacity-80">{status}</p> : null}
    </div>
  );
}
