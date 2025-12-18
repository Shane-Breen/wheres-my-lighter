import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`;

  const r = await fetch(url, {
    headers: {
      // Nominatim asks for a UA; keep it simple for pilot
      "User-Agent": "wheres-my-lighter (pilot)",
    },
    cache: "no-store",
  });

  if (!r.ok) {
    return NextResponse.json({ town: null, county: null, country: null }, { status: 200 });
  }

  const j: any = await r.json();
  const a = j?.address ?? {};

  const town =
    a.town ?? a.village ?? a.city ?? a.hamlet ?? a.suburb ?? a.county ?? null;

  const county = a.county ?? a.state ?? a.region ?? null;
  const country = a.country ?? null;

  return NextResponse.json({ town, county, country }, { status: 200 });
}
