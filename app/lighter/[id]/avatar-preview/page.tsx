import { headers } from "next/headers";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getLighterData(lighterId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";

  const res = await fetch(
    `${base}/api/lighter/${encodeURIComponent(lighterId)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to load lighter");
  }

  return res.json();
}

export default async function AvatarPreviewPage({ params }: PageProps) {
  const { id: lighterId } = await params;
  const data = await getLighterData(lighterId);

  return (
    <main className="min-h-screen bg-[#070716] text-white">
      <div className="mx-auto max-w-md px-4 py-10 space-y-6">
        <h1 className="text-xl font-semibold">
          Avatar Preview (Debug)
        </h1>

        <pre className="text-xs bg-black/40 p-4 rounded-xl overflow-x-auto">
          {JSON.stringify(data?.latest_tap, null, 2)}
        </pre>
      </div>
    </main>
  );
}
