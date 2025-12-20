"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type LighterSummary = {
  lighter_id: string;
  total_taps: number;
  unique_holders: number;

  born_at?: string | null;
  born_place?: string | null;

  current_at?: string | null;
  current_place?: string | null;

  total_km?: number | null;

  archetype?: string | null;
};

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKm(km?: number | null) {
  if (!km || km <= 0) return "0 km";
  return `${Math.round(km).toLocaleString()} km`;
}

const AVATARS: Record<string, { img: string; name: string; blurb: string }> = {
  "The Night Traveller": {
    img: "/avatars/night-traveller.png",
    name: "The Night Traveller",
    blurb: "Most active at night, drawn to the unknown",
  },
  "The Caretaker": {
    img: "/avatars/caretaker.png",
    name: "The Caretaker",
    blurb: "Always there, rarely far from home",
  },
  "The Free Spirit": {
    img: "/avatars/free-spirit.png",
    name: "The Free Spirit",
    blurb: "Continually passed around in search of experiences",
  },
  "The Temple Guard": {
    img: "/avatars/temple-guard.png",
    name: "The Temple Guard",
    blurb: "Stoic, unchanging, never leaves one spot",
  },
};

function pickArchetype(totalTaps: number) {
  const keys = Object.keys(AVATARS);
  return keys[totalTaps % keys.length] ?? "The Caretaker";
}

export default function Page({ params }: { params: { id: string } }) {
  const lighterId = params.id;

  const [data, setData] = useState<LighterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const progressMax = 5;
  const unique = data?.unique_holders ?? 0;
  const progress = Math.min(unique, progressMax);
  const progressPct = Math.round((progress / progressMax) * 100);

  const archetypeName = useMemo(() => {
    const totalTaps = data?.total_taps ?? 0;
    return data?.archetype || pickArchetype(totalTaps);
  }, [data?.archetype, data?.total_taps]);

  const archetype = AVATARS[archetypeName] ?? AVATARS["The Caretaker"];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(`/api/lighter/${encodeURIComponent(lighterId)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Failed to load lighter (${res.status})`);
        }

        const json = (await res.json()) as Partial<LighterSummary>;

        const normalized: LighterSummary = {
          lighter_id: json.lighter_id ?? lighterId,
          total_taps: Number(json.total_taps ?? 0),
          unique_holders: Number(json.unique_holders ?? 0),
          born_at: json.born_at ?? null,
          born_place: json.born_place ?? null,
          current_at: json.current_at ?? null,
          current_place: json.current_place ?? null,
          total_km: json.total_km ?? 0,
          archetype: json.archetype ?? null,
        };

        if (!cancelled) setData(normalized);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lighterId]);

  return (
    <main className="wml-root">
      <div className="wml-bg" aria-hidden="true" />
      <div className="wml-stars" aria-hidden="true" />
      <div className="wml-grain" aria-hidden="true" />

      <div className="wml-phone">
        <div className="wml-logo">
          <Image src="/logo_app.png" alt="Where’s My Lighter" width={38} height={38} />
        </div>

        <header className="wml-top">
          <div className="wml-pill">LIGHTER</div>
          <h1 className="wml-title">A Lighter, Still Becoming</h1>
          <p className="wml-sub">
            Tap to add a sighting. Profiles are optional—connection isn’t.
          </p>
        </header>

        <section className="wml-card wml-cardGlow">
          <div className="wml-cardHeader">
            <div className="wml-idRow">
              <span className="wml-idIcon" aria-hidden="true" />
              <span className="wml-idText">{data?.lighter_id ?? lighterId}</span>
            </div>
            <div className="wml-rightTag">Hidden Courier</div>
          </div>

          <div className="wml-progressRow">
            <div className="wml-progressLabel">Hatching progress</div>
            <div className="wml-progressCount">
              {progress}/{progressMax} taps
            </div>
          </div>

          <div className="wml-progressTrack" aria-label="Hatching progress">
            <div className="wml-progressFill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="wml-muted">Avatar + archetype unlock after 5 unique taps.</div>
        </section>

        <section className="wml-mid">
          <div className="wml-statCard">
            <div className="wml-statLabel">BORN</div>
            <div className="wml-statMain">{data?.born_place ?? "—"}</div>
            <div className="wml-statSub">{formatDateTime(data?.born_at)}</div>
          </div>

          <div className="wml-statCard">
            <div className="wml-statLabel">OWNERS LOG</div>
            <div className="wml-statBig">{String(unique).padStart(2, "0")}</div>
            <div className="wml-statSub">Unique holders</div>
          </div>

          <div className="wml-avatarCard">
            <div className="wml-avatarFrame">
              <Image src={archetype.img} alt={archetype.name} width={140} height={140} priority />
            </div>
            <div className="wml-avatarName">8-bit hatchling</div>
          </div>

          <div className="wml-statCard">
            <div className="wml-statLabel">TRAVEL LOG</div>
            <div className="wml-statMain">{formatKm(data?.total_km)}</div>
            <div className="wml-statSub">Total distance</div>
          </div>

          <div className="wml-statCard">
            <div className="wml-statLabel">CURRENT LOCATION</div>
            <div className="wml-statMain">{data?.current_place ?? "—"}</div>
            <div className="wml-statSub">{formatDateTime(data?.current_at)}</div>
          </div>
        </section>

        <section className="wml-card">
          <div className="wml-archetypeRow">
            <div className="wml-archetypeThumb">
              <Image src={archetype.img} alt={archetype.name} width={72} height={72} />
            </div>
            <div>
              <div className="wml-archetypeName">{archetype.name}</div>
              <div className="wml-archetypeBlurb">{archetype.blurb}</div>
            </div>
          </div>

          <div className="wml-divider" />

          <div className="wml-sectionTitle">HIDDEN COURIER</div>
          <div className="wml-sectionLine">
            <span className="wml-dot" /> Avatar <span className="wml-sep">•</span> {archetype.name}
          </div>
        </section>

        <section className="wml-card">
          <div className="wml-joinTitle">Join the journey (optional)</div>
          <div className="wml-joinCopy">
            Create a profile to appear in the Owners Log and to message past holders. No account
            required to tap—only to connect.
          </div>

          <div className="wml-btnRow">
            <button className="wml-btn wml-btnGhost" type="button">
              Create Profile
            </button>
            <button className="wml-btn wml-btnPrimary" type="button">
              Tap Without Profile
            </button>
          </div>

          <div className="wml-privacy">
            We request location permission to log a sighting. Precise GPS is stored securely. Only
            the nearest town is displayed publicly.
          </div>

          {loading && <div className="wml-footNote">Loading…</div>}
          {err && <div className="wml-footNote wml-err">Error: {err}</div>}
        </section>
      </div>
    </main>
  );
}
