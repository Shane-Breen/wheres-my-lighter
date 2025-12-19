// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseRest";

async function reverseGeocode(lat: number, lng: number) {
  // Simple + free (rate limited). Good enough for now.
  // Later: cache in supabase geo_cache table.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "wheres-my-lighter/1.0 (prototype)",
    },
  });
  if (!res.ok) return { city: null, country: null };

  const j: any = await res.json();
  const a = j?.address || {};
  const city =
    a.city || a.town || a.village || a.hamlet || a.suburb || a.county || null;
  const country = a.country || null;

  return { city, country };
}

export async function POST(req: Request, ctx: unknown) {
  const id = (ctx as any)?.params?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const visitor_id = String(body.visitor_id || "").trim();
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const accuracy_m = typeof body.accuracy_m === "number" ? body.accuracy_m : null;

  if (!visitor_id) {
    return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });
  }

  const db = supabaseRest();

  let city: string | null = null;
  let country: string | null = null;

  if (lat != null && lng != null) {
    const r = await reverseGeocode(lat, lng);
    city = r.city;
    country = r.country;
  }

  // Insert tap
  await db.request(
    "POST",
    `tap_events`,
    [
      {
        lighter_id: id,
        visitor_id,
        lat,
        lng,
        accuracy_m,
        city,
        country,
      },
    ],
    { Prefer: "return=minimal" }
  );

  return NextResponse.json({ ok: true, city, country });
}
