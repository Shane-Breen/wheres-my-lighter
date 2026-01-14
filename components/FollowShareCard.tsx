"use client";

import { useMemo, useState } from "react";

type FollowShareCardProps = {
  lighterId: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function FollowShareCard({ lighterId }: FollowShareCardProps) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"moves" | "milestones" | "all">("moves");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lighter/${encodeURIComponent(lighterId)}`;
  }, [lighterId]);

  async function copyLink() {
    setMsg(null);
    try {
      if (!link) return;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setMsg("Link copied ✨");
    } catch {
      setMsg("Couldn’t copy link.");
    }
  }

  async function shareLink() {
    setMsg(null);
    try {
      if (!link) return;

      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Where’s My Lighter?",
          text: "Track this tiny flame across the globe",
          url: link,
        });
      } else {
        await copyLink();
      }
    } catch {
      // user cancelled share -> no need to error
    }
  }

  async function followByEmail() {
    setMsg(null);

    const e = email.trim();
    if (!isValidEmail(e)) {
      setMsg("Please enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          lighter_id: lighterId,
          email: e,
          frequency,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Couldn’t follow right now.");
      }

      setEmail("");
      setMsg("Following ✨ We’ll email you on big updates.");
    } catch (err: any) {
      setMsg(err?.message || "Couldn’t follow right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_50px_rgba(140,90,255,0.08)]">
      <div className="text-xs tracking-[0.25em] text-white/60">FOLLOW & SHARE</div>

      {/* Email follow */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-[10px] tracking-[0.25em] text-white/50">FOLLOW THIS LIGHTER</div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none"
          disabled={busy}
          inputMode="email"
        />

        <div className="mt-3 flex gap-2">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90 outline-none"
            disabled={busy}
          >
            <option value="moves">Big moves only (new city/country)</option>
            <option value="milestones">Milestones (10/25/50 taps etc.)</option>
            <option value="all">Every tap (high volume)</option>
          </select>

          <button
            onClick={followByEmail}
            disabled={busy}
            className="shrink-0 rounded-xl border border-white/10 bg-purple-500/20 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500/25 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Follow"}
          </button>
        </div>

        <div className="mt-2 text-xs text-white/40">
          No spam. Unsubscribe anytime (we’ll add the link in emails later).
        </div>
      </div>

      {/* Tracking link */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-[10px] tracking-[0.25em] text-white/50">TRACKING LINK</div>

        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={link || "Loading link…"}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none"
          />
          <button
            onClick={copyLink}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Copy
          </button>
          <button
            onClick={shareLink}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Share
          </button>
        </div>

        <div className="mt-3 text-xs text-white/40">
          iPhone: tap <span className="text-white/70">Share</span> →{" "}
          <span className="text-white/70">Add to Home Screen</span>.
        </div>

        <div className="mt-3">
          <a
            href="/my"
            className="text-xs font-medium text-white/80 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            My lighters →
          </a>
        </div>
      </div>

      {msg ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          {msg}
        </div>
      ) : null}
    </section>
  );
}
