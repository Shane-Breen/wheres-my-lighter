"use client";

import { useEffect, useMemo, useState } from "react";

export default function FollowShareDrawer({ lighterId }: { lighterId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const shareUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}/lighter/${encodeURIComponent(lighterId)}`;
  }, [origin, lighterId]);

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
          email: email.trim(),
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

  async function shareNative() {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    // @ts-ignore
    if (navigator.share) {
      try {
        // @ts-ignore
        await navigator.share({
          title: "Where’s My Lighter?",
          text: "Track this lighter",
          url,
        });
      } catch {
        // user cancelled share — no need to set an error
      }
    } else {
      copyLink();
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.10)]">
      {/* Purple dropdown button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl border border-white/10 bg-purple-500/20 px-4 py-4 text-base font-medium text-white hover:bg-purple-500/25 disabled:opacity-60"
      >
        <div className="flex items-center justify-between">
          <span>Follow &amp; Share</span>
          <span className="text-xs text-white/70">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Dropdown content */}
      {open ? (
        <div className="mt-4 space-y-3">
          {/* Follow */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.25em] text-white/60">FOLLOW THIS LIGHTER</div>

            <div className="mt-3 flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />

              <button
                type="button"
                disabled={busy || !email.trim()}
                onClick={follow}
                className="rounded-xl bg-purple-500/30 px-4 py-3 text-sm text-white/90 hover:bg-purple-500/35 disabled:opacity-40"
              >
                {busy ? "…" : "Follow"}
              </button>
            </div>

            <div className="mt-2 text-[11px] text-white/40">
              No spam. Unsubscribe anytime (we’ll add the link in emails).
            </div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs tracking-[0.25em] text-white/60">TRACKING LINK</div>

            <div className="mt-3 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80">
                <div className="truncate">{shareUrl || "—"}</div>
              </div>

              <button
                type="button"
                onClick={copyLink}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 hover:bg-black/40"
              >
                Copy
              </button>

              <button
                type="button"
                onClick={shareNative}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/90 hover:bg-black/40"
              >
                Share
              </button>
            </div>

            <div className="mt-2 text-[11px] text-white/40">
              iPhone: tap Share → Add to Home Screen.
            </div>
          </div>

          {/* Status */}
          {status ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
              {status}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
