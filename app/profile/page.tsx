"use client";

import { useMemo, useState } from "react";
import { getOrCreateVisitorId } from "@/lib/visitorId";

export default function ProfilePage() {
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorId,
          display_name: name.trim() || null,
          photo_url: photoUrl.trim() || null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      alert("Saved. Go back and tap again — you’ll show as the current holder.");
    } catch {
      alert("Couldn’t save profile yet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#060614] text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-10 pt-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-xl font-semibold">Create Profile</div>
          <div className="mt-1 text-sm text-white/60">
            Optional — this links your device tap to a display name + photo.
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-xs uppercase tracking-widest text-white/60">
                Display name
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="e.g. Shane Breen"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-xs uppercase tracking-widest text-white/60">
                Photo URL
              </div>
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="https://..."
              />
            </label>

            <div className="text-xs text-white/50">
              Device ID: <span className="text-white/70">{visitorId}</span>
            </div>

            <button
              onClick={save}
              disabled={busy}
              className="mt-2 w-full rounded-2xl bg-[#7c3aed] px-4 py-3 font-semibold hover:brightness-110 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
