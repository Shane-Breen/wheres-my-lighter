import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ town: null, country: null }, { status: 200 });
  }

  // OpenStreetMap Nominatim reverse geocode (free-ish; be polite with usage)
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}&zoom=12&addressdetails=1`;

  const r = await fetch(url, {
    headers: {
      // Nominatim likes a real UA; this is minimal but helps
      "User-Agent": "wheres-my-lighter/1.0 (reverse geocode)",
      "Accept-Language": "en",
    },
  });

  if (!r.ok) {
    return NextResponse.json({ town: null, country: null }, { status: 200 });
  }

  const j: any = await r.json();
  const a = j?.address ?? {};

  const town =
    a.town ??
    a.city ??
    a.village ??
    a.hamlet ??
    a.suburb ??
    a.county ??
    null;

  const country = a.country ?? null;

  return NextResponse.json({ town, country }, { status: 200 });
}
