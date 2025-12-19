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

export async function POST(req: Request, context: any) {
  try {
    const id = context?.params?.id as string;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = (await req.json()) as TapBody;

    if (!body?.visitor_id) return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    const sb = supabaseRest();

    // 1) insert tap
    await sb.request(`/taps`, {
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
      headers: {
        Prefer: "return=minimal",
      },
    });

    // 2) recompute unique owners and last seen
    const taps = await sb.request(
      `/taps?select=visitor_id,created_at,lat,lng,city,country&lighter_id=eq.${encodeURIComponent(id)}&order=created_at.desc`
    );

    const unique = new Set<string>();
    for (const t of taps || []) if (t?.visitor_id) unique.add(t.visitor_id);

    const latest = (taps || [])[0] || null;

    // 3) update lighters summary (keep it simple for now)
    await sb.request(`/lighters?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        last_city: latest?.city ?? null,
        last_country: latest?.country ?? null,
        last_tapped_at: latest?.created_at ?? new Date().toISOString(),
        total_owners: unique.size,
      }),
      headers: {
        Prefer: "return=minimal",
      },
    });

    return NextResponse.json({ ok: true, uniqueOwners: unique.size });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
