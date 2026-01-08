import JourneyMap from "@/components/JourneyMap";
import OwnersLog from "@/components/OwnersLog";
import TapActions from "@/components/TapActions";

type PageProps = {
  params: {
    id: string;
  };
};

async function getLighterData(lighterId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/lighter/${lighterId}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

export default async function Page({ params }: PageProps) {
  const lighterId = params.id;
  const data = await getLighterData(lighterId);

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const points = journey
    .filter((p: any) => typeof p.lat === "number" && typeof p.lng === "number")
    .map((p: any) => ({ lat: p.lat, lng: p.lng }));

  const center =
    points.length > 0 ? points[points.length - 1] : { lat: 51.7, lng: -8.5 };

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto max-w-md px-4 py-10 space-y-6">

        {/* HEADER CARD */}
        <div className="wmyl-header">
          <img src="/logoo.png" className="wmyl-logo" />

          <h1 className="wmyl-title">Where’s My Lighter?</h1>

          <p className="wmyl-tagline">
            Tracking this flame across the globe
          </p>

          <div className="wmyl-stats">
            <div>
              <div className="wmyl-stat-number">{data.total_taps}</div>
              <div className="wmyl-stat-label">TOTAL TAPS</div>
            </div>
            <div>
              <div className="wmyl-stat-number">{data.unique_holders}</div>
              <div className="wmyl-stat-label">OWNERS</div>
            </div>
          </div>
        </div>

        {/* MAP — unchanged working component */}
        <JourneyMap points={points} center={center} zoom={5} />

        {/* LOG */}
        <OwnersLog lighterId={lighterId} />

        {/* ACTIONS */}
        <TapActions lighterId={lighterId} />

      </div>
    </main>
  );
}
