// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";

type TapBody = {
  visitor_id?: string;
  lat?: number;
  lng?: number;
  accuracy_m?: number | null;
  city?: string | null;
  country?: string | null;
};

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ REQUIRED for Next 15
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as TapBody;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing lighter id" }, { status: 400 });
    }

    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ ok: false, error: "Missing/invalid lat/lng" }, { status: 400 });
    }

    const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
    const SUPABASE_ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const insertPayload = {
      lighter_id: id,
      visitor_id: body.visitor_id ?? null,
      lat: body.lat,
      lng: body.lng,
      accuracy_m: typeof body.accuracy_m === "number" ? body.accuracy_m : null,
      city: body.city ?? null,
      country: body.country ?? null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/taps?select=*`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(insertPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Insert failed", details: data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, tap: Array.isArray(data) ? data[0] : data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
