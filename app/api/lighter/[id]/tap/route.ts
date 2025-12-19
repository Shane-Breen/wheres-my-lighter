// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TapBody = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
};

async function reverseGeocodeTown(
  lat: number,
  lng: number
): Promise<{ city: string | null; country: string | null }> {
  // Best-effort reverse geocode without an API key.
  // If it fails, we store nulls (still keeps precise GPS in DB).
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent
        "User-Agent": "wheres-my-lighter/1.0 (contact: dev@wheres-my-lighter)",
      },
      cache: "no-store",
    });

    if (!res.ok) return { city: null, country: null };

    const data: any = await res.json();
    const a = data?.address;

    const city =
      a?.town ||
      a?.city ||
      a?.village ||
      a?.hamlet ||
      a?.suburb ||
      a?.municipality ||
      null;

    const country = a?.country || null;

    return { city, country };
  } catch {
    return { city: null, country: null };
  }
}

export async function POST(req: Request, { params }: any) {
  try {
    const lighterId = String(params?.id || "");
    if (!lighterId) {
      return NextResponse.json(
        { ok: false, error: "Missing lighter id" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as TapBody;

    if (
      !body?.visitor_id ||
      typeof body.lat !== "number" ||
      typeof body.lng !== "number"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload. Need visitor_id, lat, lng." },
        { status: 400 }
      );
    }

    const { city, country } = await reverseGeocodeTown(body.lat, body.lng);

    const insertRow: any = {
      lighter_id: lighterId,
      visitor_id: body.visitor_id,
      lat: body.lat,
      lng: body.lng,
      accuracy_m: body.accuracy_m ?? null,
      city,
      country,
    };

    const { data, error } = await supabase
      .from("taps")
      .insert(insertRow)
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
      { ok: false, error: e?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
