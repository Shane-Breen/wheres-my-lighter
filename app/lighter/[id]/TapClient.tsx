// app/lighter/[id]/TapClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type OwnerProfile = {
  id: string;
  display_name: string;
  photo_url?: string | null;
  city?: string | null;
  archetype?: string | null;
  pattern?: string | null;
  style?: string | null; // e.g. "Hidden Courier"
};

type Lighter = {
  id: string;
  first_city: string | null;
  last_city: string | null;
  archetype: string | null;
  pattern: string | null;
  style: string | null;
  longest_possession_days: number | null;
  total_owners: number | null;
};

type Tap = {
  id: string;
  created_at: string;
  city: string;
  country?: string | null;
};

type BottleMessage = {
  id: string;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_photo_url?: string | null;
  body: string;
};

function fmtTime(ts: string) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function fmtDay(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function clamp(s: string, n = 140) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function DemoMoonIcon() {
  return (
    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
      <span className="text-2xl">🌙</span>
    </div>
  );
}

export default function TapClient({ lighterId }: { lighterId: string }) {
  const supabase = useMemo(() => getSupabase(), []);
  const demoMode = !supabase;

  const [loading, setLoading] = useState(true);

  const [lighter, setLighter] = useState<Lighter | null>(null);
  const [currentOwner, setCurrentOwner] = useState<OwnerProfile | null>(null);

  const [taps, setTaps] = useState<Tap[]>([]);
  const [messages, setMessages] = useState<BottleMessage[]>([]);

  const [msgBody, setMsgBody] = useState("");
  const [posting, setPosting] = useState(false);

  // ---------- DEMO DATA ----------
  function loadDemo() {
    const now = new Date();
    const t1 = new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString();
    const t2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString();
    const t3 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString();

    const demoLighter: Lighter = {
      id: lighterId,
      first_city: "Berlin, Germany",
      last_city: "Dublin, Ireland",
      archetype: "The Night Traveller",
      pattern: "Nocturnal",
      style: "Hidden Courier",
      longest_possession_days: 7,
      total_owners: 3,
    };

    const demoOwner: OwnerProfile = {
      id: "owner-demo-001",
      display_name: "Hidden Courier",
      photo_url: "/avatars/hidden-courier.svg",
      city: "Dublin, Ireland",
      archetype: "The Night Traveller",
      pattern: "Nocturnal",
      style: "Hidden Courier",
    };

    const demoTaps: Tap[] = [
      { id: "tap-1", created_at: t1, city: "Dublin, Ireland" },
      { id: "tap-2", created_at: t2, city: "Skibbereen, Ireland" },
      { id: "tap-3", created_at: t3, city: "Cork City, Ireland" },
    ];

    const demoMsgs: BottleMessage[] = [
      {
        id: "m1",
        created_at: t2,
        owner_id: "owner-a",
        owner_name: "Night Walker",
        owner_photo_url: "/avatars/night-walker.svg",
        body: "If this little flame finds you, you’re part of the story now.",
      },
      {
        id: "m2",
        created_at: t1,
        owner_id: "owner-demo-001",
        owner_name: "Hidden Courier",
        owner_photo_url: "/avatars/hidden-courier.svg",
        body: "Tapped in Dublin. Passing through quietly. Keep it moving.",
      },
    ];

    setLighter(demoLighter);
    setCurrentOwner(demoOwner);
    setTaps(demoTaps);
    setMessages(demoMsgs);
  }

  // ---------- SUPABASE LOAD ----------
  async function loadReal() {
    if (!supabase) return;

    // You can wire these tables exactly, but this code will not crash if they’re missing.
    // Expected tables:
    // - lighters (id, first_city, last_city, archetype, pattern, style, longest_possession_days, total_owners)
    // - taps (id, lighter_id, created_at, city, country)
    // - profiles (id, display_name, photo_url, city)
    // - ownerships (lighter_id, owner_id, started_at, ended_at NULL for current)
    // - bottle_messages (id, lighter_id, owner_id, created_at, body)

    const { data: lData } = await supabase
      .from("lighters")
      .select("*")
      .eq("id", lighterId)
      .maybeSingle();

    if (lData) setLighter(lData as Lighter);

    const { data: tapData } = await supabase
      .from("taps")
      .select("id, created_at, city, country")
      .eq("lighter_id", lighterId)
      .order("created_at", { ascending: false })
      .limit(50);

    setTaps((tapData ?? []) as Tap[]);

    // current owner
    const { data: own } = await supabase
      .from("ownerships")
      .select("owner_id")
      .eq("lighter_id", lighterId)
      .is("ended_at", null)
      .maybeSingle();

    if (own?.owner_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, display_name, photo_url, city, archetype, pattern, style")
        .eq("id", own.owner_id)
        .maybeSingle();

      if (prof) setCurrentOwner(prof as OwnerProfile);
    }

    // messages
    const { data: msgs } = await supabase
      .from("bottle_messages")
      .select("id, created_at, owner_id, body")
      .eq("lighter_id", lighterId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgs?.length) {
      // join profiles locally (cheap + safe)
      const ownerIds = Array.from(new Set(msgs.map((m) => m.owner_id)));
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, display_name, photo_url")
        .in("id", ownerIds);

      const map = new Map<string, { display_name: string; photo_url?: string | null }>();
      (ps ?? []).forEach((p: any) => map.set(p.id, { display_name: p.display_name, photo_url: p.photo_url }));

      setMessages(
        msgs.map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          owner_id: m.owner_id,
          owner_name: map.get(m.owner_id)?.display_name ?? "Unknown",
          owner_photo_url: map.get(m.owner_id)?.photo_url ?? null,
          body: m.body,
        }))
      );
    } else {
      setMessages([]);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (demoMode) loadDemo();
        else await loadReal();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lighterId]);

  const lastTap = taps[0] ?? null;

  async function logTap() {
    // In real mode: create a tap record (city could come from geolocation later)
    // In demo mode: push a fake tap
    if (demoMode) {
      const cityChoices = ["Berlin, Germany", "Lisbon, Portugal", "Dublin, Ireland", "Skibbereen, Ireland", "Paris, France"];
      const city = cityChoices[Math.floor(Math.random() * cityChoices.length)];
      const next: Tap = {
        id: "tap-" + Math.random().toString(16).slice(2),
        created_at: new Date().toISOString(),
        city,
      };
      setTaps((prev) => [next, ...prev]);
      setLighter((prev) => (prev ? { ...prev, last_city: city, first_city: prev.first_city ?? city } : prev));
      return;
    }

    if (!supabase) return;

    const fallbackCity = "Unknown City";

    const { data, error } = await supabase
      .from("taps")
      .insert([{ lighter_id: lighterId, city: fallbackCity }])
      .select("id, created_at, city, country")
      .single();

    if (!error && data) {
      setTaps((prev) => [data as Tap, ...prev]);

      // update last_city + first_city if needed
      await supabase
        .from("lighters")
        .update({
          last_city: data.city,
          first_city: (lighter?.first_city ?? null) ? lighter?.first_city : data.city,
        })
        .eq("id", lighterId);

      setLighter((prev) =>
        prev
          ? {
              ...prev,
              last_city: data.city,
              first_city: prev.first_city ?? data.city,
            }
          : prev
      );
    }
  }

  async function postBottleMessage() {
    const body = msgBody.trim();
    if (!body) return;

    setPosting(true);
    try {
      if (demoMode) {
        const next: BottleMessage = {
          id: "m-" + Math.random().toString(16).slice(2),
          created_at: new Date().toISOString(),
          owner_id: currentOwner?.id ?? "owner-demo",
          owner_name: currentOwner?.display_name ?? "Hidden Courier",
          owner_photo_url: currentOwner?.photo_url ?? "/avatars/hidden-courier.svg",
          body: clamp(body, 240),
        };
        setMessages((prev) => [next, ...prev]);
        setMsgBody("");
        return;
      }

      if (!supabase) return;

      // Requires auth + current user profile to be set.
      // For now, allow posting even if owner unknown by using a placeholder owner_id.
      const owner_id = currentOwner?.id ?? "unknown-owner";

      const { data, error } = await supabase
        .from("bottle_messages")
        .insert([{ lighter_id: lighterId, owner_id, body }])
        .select("id, created_at, owner_id, body")
        .single();

      if (!error && data) {
        setMessages((prev) => [
          {
            id: data.id,
            created_at: data.created_at,
            owner_id: data.owner_id,
            owner_name: currentOwner?.display_name ?? "Unknown",
            owner_photo_url: currentOwner?.photo_url ?? null,
            body: data.body,
          },
          ...prev,
        ]);
        setMsgBody("");
      }
    } finally {
      setPosting(false);
    }
  }

  if (loading || !lighter) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-white/70">
        Loading…
      </div>
    );
  }

  // COPY (your spec)
  const copy = {
    title: "LIGHTER",
    archetypeLabel: "Archetype",
    patternLabel: "Pattern",
    styleLabel: "Style",
    streakLabel: "Possession Streak",
    ownersLabel: "Total Owners",
    journeyTitle: "Journey (Factual)",
    firstTapped: "First carried in",
    lastSeen: "Last seen in",
    bottleTitle: "Message in a Gas Bottle",
    bottleSub: "Previous owners can leave a message — and if you want, connect.",
    actions: "ACTIONS",
    btnProfile: "PROFILE",
    btnLocation: "LOCATION",
    btnSocial: "SOCIAL",
    btnPing: "PING",
    btnTap: "Log Tap",
  };

  const topArchetype = lighter.archetype ?? currentOwner?.archetype ?? "Unknown";
  const topPattern = lighter.pattern ?? currentOwner?.pattern ?? "Unknown";
  const topStyle = lighter.style ?? currentOwner?.style ?? currentOwner?.display_name ?? "Hidden Courier";

  const firstCity = lighter.first_city ?? taps[taps.length - 1]?.city ?? "Unknown";
  const lastCity = lighter.last_city ?? taps[0]?.city ?? "Unknown";

  return (
    <div className="w-full flex justify-center px-4 py-8">
      <div className="w-full max-w-[420px]">
        {/* Phone frame vibe */}
        <div className="rounded-[28px] overflow-hidden bg-[#0b1020] shadow-2xl border border-white/10">
          {/* Top bar */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <div className="text-white font-semibold tracking-wide">{copy.title}</div>
            <div className="text-white/80 font-medium">
              {lastTap ? fmtTime(lastTap.created_at) : "—:—"}
            </div>
          </div>

          {/* Profile / meta card */}
          <div className="px-5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex gap-4 items-center">
              {currentOwner?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentOwner.photo_url}
                  alt={currentOwner.display_name}
                  className="h-12 w-12 rounded-full object-cover border border-white/15"
                />
              ) : (
                <DemoMoonIcon />
              )}

              <div className="min-w-0">
                <div className="text-white/70 text-xs">Current Owner Profile</div>
                <div className="text-white font-semibold truncate">
                  {currentOwner?.display_name ?? topStyle}
                </div>
                <div className="text-white/50 text-xs truncate">
                  {currentOwner?.city ?? lastCity}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 mt-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-white/60 text-xs">{copy.archetypeLabel}</div>
                  <div className="text-white font-semibold">{topArchetype}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-white/60 text-xs">{copy.patternLabel}</div>
                  <div className="text-white font-semibold">{topPattern}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-white/60 text-xs">{copy.styleLabel}</div>
                  <div className="text-white font-semibold">{topStyle}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-white/60 text-xs">{copy.streakLabel}</div>
                  <div className="text-white font-semibold">
                    {String(lighter.longest_possession_days ?? 0).padStart(2, "0")} Days
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                <div className="text-white/60 text-xs">{copy.ownersLabel}</div>
                <div className="text-white font-semibold">
                  {String(lighter.total_owners ?? 0).padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>

          {/* Journey (Factual) */}
          <div className="px-5 mt-5">
            <div className="text-white/70 font-semibold">{copy.journeyTitle}</div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#5b2bf0]/80 border border-white/10 p-4">
                <div className="text-white/70 text-xs">{copy.firstTapped}</div>
                <div className="text-white font-semibold mt-1">
                  {firstCity.split(",")[0]}{" "}
                  <span className="text-white/70">{firstCity.includes(",") ? firstCity.split(",").slice(1).join(",") : ""}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#5b2bf0]/80 border border-white/10 p-4">
                <div className="text-white/70 text-xs">{copy.lastSeen}</div>
                <div className="text-white font-semibold mt-1">
                  {lastCity.split(",")[0]}{" "}
                  <span className="text-white/70">{lastCity.includes(",") ? lastCity.split(",").slice(1).join(",") : ""}</span>
                </div>
              </div>
            </div>

            <button
              onClick={logTap}
              className="mt-4 w-full rounded-2xl bg-[#5b2bf0] hover:bg-[#6a3bff] text-white font-semibold py-4 shadow-lg shadow-[#5b2bf0]/30"
            >
              {copy.btnTap}
            </button>

            <div className="mt-3 text-center text-xs text-white/40">
              {demoMode ? "Demo mode is on. Taps are simulated." : "Tap logs will be saved to the database."}
            </div>
          </div>

          {/* Gas bottle messages */}
          <div className="px-5 mt-6 pb-6">
            <div className="text-white/70 font-semibold">{copy.bottleTitle}</div>
            <div className="text-white/40 text-xs mt-1">{copy.bottleSub}</div>

            <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-3">
              <textarea
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Leave a note for whoever holds this next…"
                className="w-full bg-transparent text-white placeholder:text-white/30 outline-none resize-none text-sm min-h-[80px]"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-white/30">{msgBody.length}/240</div>
                <button
                  onClick={postBottleMessage}
                  disabled={posting || !msgBody.trim()}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-40"
                >
                  {posting ? "Sending…" : "Send"}
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    {m.owner_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.owner_photo_url}
                        alt={m.owner_name}
                        className="h-9 w-9 rounded-full object-cover border border-white/15"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">🔥</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-white text-sm font-semibold truncate">{m.owner_name}</div>
                      <div className="text-white/40 text-xs">{fmtDay(m.created_at)} {fmtTime(m.created_at)}</div>
                    </div>
                  </div>

                  <div className="text-white/80 text-sm mt-3 leading-relaxed">
                    {m.body}
                  </div>
                </div>
              ))}
              {!messages.length && (
                <div className="text-white/40 text-sm mt-2">
                  No messages yet. Be the first to drop one in the bottle.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6">
              <div className="text-white/60 font-semibold">{copy.actions}</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button className="rounded-2xl bg-[#5b2bf0]/70 hover:bg-[#5b2bf0] text-white font-semibold py-4">
                  {copy.btnProfile}
                </button>
                <button className="rounded-2xl bg-[#5b2bf0]/70 hover:bg-[#5b2bf0] text-white font-semibold py-4">
                  {copy.btnLocation}
                </button>
                <button className="rounded-2xl bg-[#5b2bf0]/70 hover:bg-[#5b2bf0] text-white font-semibold py-4">
                  {copy.btnSocial}
                </button>
                <button className="rounded-2xl bg-[#5b2bf0]/70 hover:bg-[#5b2bf0] text-white font-semibold py-4">
                  {copy.btnPing}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom nav (visual only) */}
          <div className="border-t border-white/10 bg-white/5 px-6 py-4 flex justify-between text-white/70 font-semibold">
            <span>HOME</span>
            <span className="underline underline-offset-8">LIGHTER</span>
            <span>SETTINGS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
