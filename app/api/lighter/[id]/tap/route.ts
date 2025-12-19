// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

type TapBody = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  city?: string | null;
  country?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });

  let body: TapBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.visitor_id || typeof body.lat !== "number" || typeof body.lng !== "number") {
    return NextResponse.json({ error: "Missing visitor_id/lat/lng" }, { status: 400 });
  }

  // Try insert into `taps`. If RLS blocks, we still return ok so UI works.
  try {
    const res = await supabaseRest(`taps`, {
      method: "POST",
      body: JSON.stringify({
        lighter_id: id,
        visitor_id: body.visitor_id,
        lat: body.lat,
        lng: body.lng,
        accuracy_m: body.accuracy_m ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        ok: true,
        lighter_id: id,
        stored: false,
        reason: "DB insert blocked (likely RLS) or schema mismatch.",
        details: text,
      });
    }

    const rows = await res.json();
    return NextResponse.json({ ok: true, lighter_id: id, stored: true, rows });
  } catch (e: any) {
    return NextResponse.json({
      ok: true,
      lighter_id: id,
      stored: false,
      reason: "DB call failed",
      details: String(e?.message ?? e),
    });
  }
}
