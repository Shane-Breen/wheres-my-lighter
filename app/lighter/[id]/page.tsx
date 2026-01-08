import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";

async function getLighter(id: string) {
  const res = await fetch(`/api/lighter/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

export default async function LighterPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getLighter(params.id);

  const latest = data.latest_tap;
  const location =
    latest?.city && latest?.country
      ? `${latest.city}, ${latest.country}`
      : "Unknown location";

  const mapPoints = [];
  if (data.birth_tap?.lat && data.birth_tap?.lng) {
    mapPoints.push({
      lat: data.birth_tap.lat,
      lng: data.birth_tap.lng,
    });
  }
  if (data.latest_tap?.lat && data.latest_tap?.lng) {
    mapPoints.push({
      lat: data.latest_tap.lat,
      lng: data.latest_tap.lng,
    });
  }

  return (
    <div className="min-h-screen bg-[#070614] text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-10 space-y-4">

        {/* HEADER CARD */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs tracking-widest text-white/50">
            LIGHTER
          </div>

          <div className="mt-2 flex justify-between">
            <div>
              <div className="text-lg font-semibold">{location}</div>
              <div className="text-xs text-white/50">
                Last seen{" "}
                {latest?.tapped_at
                  ? new Date(latest.tapped_at).toLocaleString()
                  : "—"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{data.total_taps}</div>
              <div className="text-xs text-white/50">TAPS</div>

              <div className="mt-1 text-lg font-bold">
                {data.unique_holders}
              </div>
              <div className="text-xs text-white/50">OWNERS</div>
            </div>
          </div>
        </div>

        {/* MAP */}
        <JourneyMap points={mapPoints} />

        {/* OWNERS LOG (TEMP: anonymous only) */}
        <OwnersLog
          owners={[
            ...(data.latest_tap
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
            href={`/profile/create?lighter=${params.id}`}
            className="block text-center rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-3"
          >
            Create Profile
          </a>

          <a
            href={`/api/lighter/${params.id}/tap`}
            className="block text-center rounded-xl bg-purple-500/20 hover:bg-purple-500/25 border border-purple-400/30 py-3"
          >
            Tap Without Profile
          </a>

          <p className="text-xs text-white/50 pt-2">
            We request location permission to log a sighting. Precise GPS is
            stored securely. Only the nearest town is displayed publicly.
          </p>
        </div>
      </div>
    </div>
  );
}
