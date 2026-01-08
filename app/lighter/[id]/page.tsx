import JourneyMap from "../../../components/JourneyMap";
import OwnersLog from "../../../components/OwnersLog";
import { headers } from "next/headers";

type Tap = {
  id: string;
  lighter_id: string;
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  city: string | null;
  country: string | null;
  tapped_at: string;
};

type LighterApiResponse = {
  ok: boolean;
  lighter_id: string;
  total_taps: number;
  unique_holders: number;
  birth_tap: Tap | null;
  latest_tap: Tap | null;
};

async function absoluteUrl(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}${path}`;
}

async function getLighter(id: string): Promise<LighterApiResponse> {
  const url = await absoluteUrl(`/api/lighter/${encodeURIComponent(id)}`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load lighter (${res.status})`);
  return res.json();
}

function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default async function Page(props: any) {
  const params = await Promise.resolve(props?.params);
  const id: string | undefined = params?.id;

  if (!id) {
    return (
      <div className="min-h-screen bg-[#070614] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Missing lighter id</div>
          <div className="text-sm text-white/60 mt-2">
            This page needs a URL like <span className="text-white/80">/lighter/pilot-002</span>.
          </div>
        </div>
      </div>
    );
  }

  const data = await getLighter(id);

  const latest = data.latest_tap;
  const location =
    latest?.city && latest?.country ? `${latest.city}, ${latest.country}` : "Unknown location";

  // For now we only have birth + latest available from API.
  // Next step: upgrade API to return full journey points and grouped owners.
  const mapPoints: { lat: number; lng: number }[] = [];
  if (data.birth_tap?.lat && data.birth_tap?.lng) mapPoints.push({ lat: data.birth_tap.lat, lng: data.birth_tap.lng });
  if (data.latest_tap?.lat && data.latest_tap?.lng) mapPoints.push({ lat: data.latest_tap.lat, lng: data.latest_tap.lng });

  return (
    <div className="min-h-screen text-white bg-[#070614]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute top-36 left-1/2 -translate-x-1/2 h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070614] via-[#070614] to-black/60" />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-6 pb-12 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between px-1">
          <div className="text-sm tracking-[0.25em] text-white/80">LIGHTER</div>
          <div className="text-white/40 text-sm">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Header card like mock */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/25 to-indigo-500/25 border border-white/10 flex items-center justify-center">
                <span className="text-xl">🌙</span>
              </div>

              <div className="flex-1">
                <div className="text-xl font-semibold tracking-tight">{location}</div>
                <div className="text-xs text-white/50 mt-1">Last seen {fmtWhen(latest?.tapped_at)}</div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold leading-none">{data.total_taps}</div>
                <div className="text-[10px] tracking-[0.22em] text-white/50 mt-1">TOTAL TAPS</div>
                <div className="mt-3 text-2xl font-bold leading-none">{data.unique_holders}</div>
                <div className="text-[10px] tracking-[0.22em] text-white/50 mt-1">OWNERS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Big map hero */}
        <JourneyMap points={mapPoints} />

        {/* Owners Log */}
        <OwnersLog
          owners={[
            ...(data.latest_tap?.visitor_id
              ? [
                  {
                    anon_holder_id: data.latest_tap.visitor_id,
                    tap_count: 1,
                    last_town: data.latest_tap.city,
                    last_country: data.latest_tap.country,
                  },
                ]
              : []),
          ]}
        />

        {/* Actions row like mock */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/profile/create?lighter=${id}`}
              className="text-center rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 py-3 text-sm"
            >
              Create Profile
            </a>

            <a
              href={`/api/lighter/${id}/tap`}
              className="text-center rounded-2xl bg-purple-500/20 hover:bg-purple-500/25 border border-purple-400/30 py-3 text-sm"
            >
              Tap Without Profile
            </a>
          </div>

          <p className="text-xs text-white/50 pt-3 leading-relaxed">
            We request location permission to log a sighting. Precise GPS is stored securely.
            Only the nearest town is displayed publicly.
          </p>
        </div>
      </div>
    </div>
  );
}
