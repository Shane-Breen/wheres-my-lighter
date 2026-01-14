"use client";

import { useMemo, useState } from "react";

export default function FollowShareDrawer({ lighterId }: { lighterId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lighter/${encodeURIComponent(lighterId)}`;
  }, [lighterId]);

  async function follow() {
    try {
      setBusy(true);
      setStatus(null);

      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          lighter_id: lighterId,
          email,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Follow failed");
      }

      setStatus("You're following this lighter ✨ Check your inbox.");
      setEmail("");
    } catch (e: any) {
      setStatus(e?.message || "Follow failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      await navigator.clipboard.writeText(url);
      setStatus("Link copied ✨");
    } catch {
      setStatus("Couldn’t copy link (try long-press + Copy).");
    }
  }

  function shareNative() {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    // @ts-ignore
    if (navigator.share) {
      // @ts-ignore
      navigator.share({ title: "Where’s My Lighter?", text: "Track this lighter", url });
    } else {
      copyLink();
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/90"
      >
        <span className="text-xs tracking-[0.25em] text-white/70">EXTRAS</span>
        <span className="text-xs text-white/60">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.25em] text-white/60">FOLLOW THIS LIGHTER</div>

            <div className="mt-3 flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email for updates"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                type="button"
                disabled={busy || !email.trim()}
                onClick={follow}
                className="rounded-xl border border-white/10 bg-purple-500/30 px-3 py-2 text-sm text-white/90 disabled:opacity-40"
              >
                {busy ? "…" : "Follow"}
              </button>
            </div>

            <div className="mt-2 text-[11px] text-white/40">
              We’ll email you when this lighter shows up somewhere new.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.25em] text-white/60">SHARE</div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90"
              >
                Copy link
              </button>

              <button
                type="button"
                onClick={shareNative}
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90"
              >
                Share
              </button>
            </div>

            <div className="mt-2 text-[11px] text-white/40">
              Tip: iPhone → Share → “Add to Home Screen”.
            </div>
          </div>

          {status && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              {status}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
