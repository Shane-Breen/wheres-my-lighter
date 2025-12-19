// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function GET(_: Request, { params }: any) {
  try {
    const lighterId = String(params?.id || "");
    if (!lighterId) {
      return NextResponse.json({ ok: false, error: "Missing lighter id" }, { status: 400 });
    }

    // Pull taps ordered by time
    const { data: taps, error } = await supabase
      .from("taps")
      .select("id, visitor_id, lat, lng, accuracy_m, city, country, tapped_at")
      .eq("lighter_id", lighterId)
      .order("tapped_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: "Fetch failed", details: error }, { status: 500 });
    }

    const safeTaps = (taps || []).filter((t: any) => typeof t.lat === "number" && typeof t.lng === "number");

    const tapCount = (taps || []).length;

    const uniqueVisitors = new Set<string>();
    for (const t of taps || []) {
      if (t?.visitor_id) uniqueVisitors.add(String(t.visitor_id));
    }

    const birth = (taps || [])[0] || null;
    const current = (taps || [])[tapCount - 1] || null;

    // Distance: sum consecutive segments
    let distanceKm = 0;
    for (let i = 1; i < safeTaps.length; i++) {
      distanceKm += haversineKm(
        { lat: safeTaps[i - 1].lat, lng: safeTaps[i - 1].lng },
        { lat: safeTaps[i].lat, lng: safeTaps[i].lng }
      );
    }

    return NextResponse.json({
      ok: true,
      stats: {
        lighter_id: lighterId,
        tap_count: tapCount,
        unique_holders: uniqueVisitors.size,
        distance_km: Math.round(distanceKm),
        birth: birth
          ? { tapped_at: birth.tapped_at, city: birth.city ?? null, country: birth.country ?? null }
          : null,
        current: current
          ? { tapped_at: current.tapped_at, city: current.city ?? null, country: current.country ?? null }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unknown server error" }, { status: 500 });
  }
}
