import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime
export const dynamic = "force-dynamic";

type ReqBody = {
  lat: number;
  lng: number;
  accuracy?: number | null; // meters (optional)
};

/**
 * Privacy: snap coordinates to ~1km grid before geocoding.
 * 0.01° latitude ≈ 1.11km. Longitude varies but stays coarse enough.
 */
function snapTo1km(lat: number, lng: number) {
  const step = 0.01;
  const snappedLat = Math.round(lat / step) * step;
  const snappedLng = Math.round(lng / step) * step;

  return {
    lat: Number(snappedLat.toFixed(5)),
    lng: Number(snappedLng.toFixed(5)),
  };
}

/**
 * Nominatim usage: you MUST provide a real User-Agent per their policy.
 * Set env var: NOMINATIM_USER_AGENT
 * Example: "wheres-my-lighter/1.0 (contact: hello@yourdomain.com)"
 */
const UA =
  process.env.NOMINATIM_USER_AGENT ||
  "wheres-my-lighter/1.0 (contact: please-set-NOMINATIM_USER_AGENT)";

// Tiny in-memory cache (best effort on serverless; still helps on warm lambdas)
const cache = new Map<string, { at: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function pickTown(address: any): string {
  return (
    address?.town ||
    address?.city ||
    address?.village ||
    address?.hamlet ||
    address?.locality ||
    address?.neighbourhood ||
    address?.suburb ||
    ""
  );
}

function pickCounty(address: any): string {
  // Ireland often uses county/state/county style depending on source
  return address?.county || address?.state || address?.region || "";
}

function pickCountry(address: any): string {
  return address?.country || "";
}

export async function POST(req: Request) {
  let body: ReqBody;

  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  // Always snap to ~1km grid (privacy-first)
  const snapped = snapTo1km(lat, lng);
  const key = `${snapped.lat.toFixed(2)},${snapped.lng.toFixed(2)}`;

  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { status: 200 });
  }

  // Nominatim reverse geocode
  // NOTE: Add accept-language to bias English names
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(snapped.lat));
  url.searchParams.set("lon", String(snapped.lng));
  url.searchParams.set("zoom", "12"); // town-ish; not street-level
  url.searchParams.set("addressdetails", "1");

  // Hard timeout so Vercel never hangs
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Accept-Language": "en",
      },
      signal: controller.signal,
      // Nominatim is public; no need to cache at fetch layer
      cache: "no-store",
    });

    if (!res.ok) {
      const data = {
        town: "",
        county: "",
        country: "",
        label: "",
        snapped,
        source: "nominatim",
        ok: false,
      };
      cache.set(key, { at: now, data });
      return NextResponse.json(data, { status: 200 });
    }

    const json: any = await res.json();
    const address = json?.address || {};

    const town = pickTown(address);
    const county = pickCounty(address);
    const country = pickCountry(address);

    // label: prefer town, else county, else country
    const primary = town || county || country || "";
    const label = [primary, country && primary !== country ? country : ""].filter(Boolean).join(", ");

    const data = {
      town,
      county,
      country,
      label,
      snapped,
      source: "nominatim",
      ok: true,
    };

    cache.set(key, { at: now, data });
    return NextResponse.json(data, { status: 200 });
  } catch {
    const data = {
      town: "",
      county: "",
      country: "",
      label: "",
      snapped,
      source: "nominatim",
      ok: false,
    };
    cache.set(key, { at: now, data });
    return NextResponse.json(data, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
