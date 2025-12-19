// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";

type TapBody = {
  visitor_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracy_m?: number | null;
  city?: string | null;
  country?: string | null;
  place_label?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as TapBody;

    // IMPORTANT: for now we log GPS on first tap too (no privacy filtering yet)
    const row = {
      lighter_id: id,
      visitor_id: body.visitor_id ?? null,
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      accuracy_m: typeof body.accuracy_m === "number" ? body.accuracy_m : null,
      city: body.city ?? null,
      country: body.country ?? null,
      place_label: body.place_label ?? null,
      tapped_at: new Date().toISOString(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/taps`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "Insert failed",
          status: res.status,
          details: json,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, inserted: json }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
