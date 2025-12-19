// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

type TapRow = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  city: string | null;
  country: string | null;
  created_at?: string;
  tapped_at?: string;
};

function haversineKm(a: TapRow, b: TapRow) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });

  let taps: TapRow[] = [];
  try {
    const res = await supabaseRest(
      `taps?select=visitor_id,lat,lng,accuracy_m,city,country,created_at,tapped_at&lighter_id=eq.${encodeURIComponent(id)}&order=created_at.asc`
    );
    if (res.ok) taps = await res.json();
  } catch {
    // leave taps empty
  }

  const uniqueOwners = new Set(taps.map(t => t.visitor_id)).size;
  const first = taps[0];
  const last = taps[taps.length - 1];

  let totalKm = 0;
  for (let i = 1; i < taps.length; i++) totalKm += haversineKm(taps[i - 1], taps[i]);

  const birth = first
    ? { label: [first.city, first.country].filter(Boolean).join(", ") || "Unknown" }
    : { label: "No taps yet" };

  const lastSeen = last
    ? { label: [last.city, last.country].filter(Boolean).join(", ") || "Unknown" }
    : { label: "No taps yet" };

  return NextResponse.json({
    id,
    taps_count: taps.length,
    unique_owners: uniqueOwners,
    birth,
    last_seen: lastSeen,
    total_distance_km: Math.round(totalKm),
    hatch_progress: {
      taps: uniqueOwners,
      required: 5,
      hatched: uniqueOwners >= 5,
    },
  });
}
