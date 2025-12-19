import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type TapBody = {
  visitor_id?: string;
  lat?: number;
  lng?: number;
  accuracy_m?: number;
};

function pickTownLabel(addr: any): { city: string | null; country: string | null; place_label: string | null } {
  const city =
    addr?.town ??
    addr?.village ??
    addr?.city ??
    addr?.hamlet ??
    addr?.locality ??
    addr?.municipality ??
    null;

  const country = addr?.country ?? null;

  const place_label = city && country ? `${city}, ${country}` : country ? country : null;

  return { city, country, place_label };
}

async function reverseGeocode(lat: number, lng: number) {
  // OpenStreetMap Nominatim (free). Good for prototypes.
  // IMPORTANT: add a User-Agent header per their usage policy.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=12&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "wheres-my-lighter/1.0 (prototype)",
      "Accept-Language": "en",
    },
    // avoid caching stale places
    cache: "no-store",
  });

  if (!res.ok) return { city: null, country: null, place_label: null };

  const json: any = await res.json();
  return pickTownLabel(json?.address);
}

export async function POST(req: Request, context: any) {
  try {
    const lighterId = String(context?.params?.id ?? "");
    if (!lighterId) {
      return NextResponse.json({ ok: false, error: "Missing lighter id" }, { status: 400 });
    }

    const body = (await req.json()) as TapBody;

    const visitor_id = body.visitor_id ?? null;
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;
    const accuracy_m = typeof body.accuracy_m === "number" ? Math.round(body.accuracy_m) : null;

    if (!lat || !lng) {
      return NextResponse.json({ ok: false, error: "Missing GPS lat/lng" }, { status: 400 });
    }

    // Reverse geocode to town/city label for display
    const { city, country, place_label } = await reverseGeocode(lat, lng);

    const { data, error } = await supabaseServer
      .from("taps")
      .insert({
        lighter_id: lighterId,
        visitor_id,
        lat,
        lng,
        accuracy_m,
        city,
        country,
        place_label,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Insert failed", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tap: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
