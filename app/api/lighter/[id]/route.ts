import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const lighterId = params.id;

  const { data: lighter } = await supabase
    .from("lighters")
    .select("*")
    .eq("id", lighterId)
    .maybeSingle();

  const { data: taps, error: tapsErr } = await supabase
    .from("taps")
    .select("phone_id, lat, lon, accuracy_m, created_at")
    .eq("lighter_id", lighterId)
    .order("created_at", { ascending: true });

  if (tapsErr) {
    return NextResponse.json({ error: tapsErr.message }, { status: 500 });
  }

  const tapsSafe = (taps ?? []).map(t => ({
    phone_id: t.phone_id,
    lat: t.lat,
    lon: t.lon,
    accuracy_m: t.accuracy_m,
    created_at: t.created_at
  }));

  const uniqueOwners = new Set(tapsSafe.map(t => t.phone_id)).size;

  // compute travel distance from consecutive taps that have coords
  let distanceKm = 0;
  const withCoords = tapsSafe.filter(t => typeof t.lat === "number" && typeof t.lon === "number");
  for (let i = 1; i < withCoords.length; i++) {
    distanceKm += haversineKm(
      { lat: withCoords[i - 1].lat as number, lon: withCoords[i - 1].lon as number },
      { lat: withCoords[i].lat as number, lon: withCoords[i].lon as number }
    );
  }

  const firstTap = tapsSafe[0] ?? null;
  const lastTap = tapsSafe[tapsSafe.length - 1] ?? null;

  return NextResponse.json({
    lighter: lighter ?? { id: lighterId, archetype: null, pattern: null, style: null },
    stats: {
      taps: tapsSafe.length,
      uniqueOwners,
      totalDistanceKm: Math.round(distanceKm * 10) / 10,
      firstTappedAt: firstTap?.created_at ?? null,
      lastTappedAt: lastTap?.created_at ?? null
    },
    taps: tapsSafe
  });
}
