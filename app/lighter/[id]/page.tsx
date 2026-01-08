import JourneyMap from "../../../components/JourneyMap";
import OwnersLog from "../../../components/OwnersLog";
import { headers } from "next/headers";

type LighterApiResponse = {
  ok: boolean;
  lighter_id: string;
  total_taps: number;
  unique_holders: number;
  birth_tap: null | {
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
  latest_tap: null | {
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
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

async function getLighter(id: string): Promise<LighterApiResponse> {
  const base = await getBaseUrl();
  const url = `${base}/api/lighter/${id}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load lighter (${res.status})`);
  }
  return res.json();
}

export default async function Page(props: any) {
  // Next 15 can pass params as a Promise-like value — normalize it safely
  const params = await Promise.resolve(props?.params);
  const id: string | undefined = params?.id;

  if (!id) {
    return (
      <div className="min-h-screen bg-[#070614] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Missing lighter id</div>
          <div className="text-sm text-white/60 mt-2">
            This page needs a URL like <span className="text-white/80">/lighter/pilot-002</span>.
          </div>
        </div>
      </div>
    );
  }

  let data: LighterApiResponse;
  try {
    data = await getLighter(id);
  } catch (e: any) {
    return (
      <div className="min-h-screen bg-[#070614] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold">Couldn’t load lighter</div>
          <div className="text-sm text-white/60 mt-2">
            {e?.message ?? "Unknown error"}
          </div>
          <div className="text-xs text-white/40 mt-3">
            Tip: check Vercel → Logs for the exact server exception.
          </div>
        </div>
      </div>
    );
  }

  const latest = data.latest_tap;
  const location =
    latest?.city && latest?.country ? `${latest.city}, ${latest.country}` : "Unknown location";

  const mapPoints: { lat: number; lng: number }[] = [];
  if (data.birth_tap?.lat && data.birth_tap?.lng) mapPoints.push({ lat: data.birth_tap.lat, lng: data.birth_tap.lng });
  if (data.latest_tap?.lat && data.latest_tap?.lng) mapPoints.push({ lat: data.latest_tap.lat, lng: data.latest_tap.lng });

  return (
    <div className="min-h-screen bg-[#070614] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-10 space-y-4">

        {/* HEADER */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-widest text-white/50">LIGHTER</div>

          <div className="mt-2 flex justify-between">
            <div>
              <div className="text-lg font-semibold">{location}</div>
              <div className="text-xs text-white/50">
                Last seen{" "}
                {latest?.tapped_at ? new Date(latest.tapped_at).toLocaleString() : "—"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{data.total_taps}</div>
              <div className="text-xs text-white/50">TAPS</div>

              <div className="mt-1 text-lg font-bold">{data.unique_holders}</div>
              <div className="text-xs text-white/50">OWNERS</div>
            </div>
          </div>
        </div>

        {/* MAP */}
        <JourneyMap points={mapPoints} />

        {/* OWNERS LOG (TEMP: shows latest holder only for now) */}
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

        {/* ACTIONS */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <a
            href={`/profile/create?lighter=${id}`}
            className="block text-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-3"
          >
            Create Profile
          </a>

          <a
            href={`/api/lighter/${id}/tap`}
            className="block text-center rounded-xl bg-purple-500/20 hover:bg-purple-500/25 border border-purple-400/30 py-3"
          >
            Tap Without Profile
          </a>

          <p className="text-xs text-white/50 pt-2">
            We request location permission to log a sighting. Precise GPS is stored securely.
            Only the nearest town is displayed publicly.
          </p>
        </div>
      </div>
    </div>
  );
}
