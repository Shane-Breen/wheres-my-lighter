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
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await req.json()) as TapBody;

    if (!body?.visitor_id || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ error: "Missing or invalid body" }, { status: 400 });
    }

    const sb = supabaseRest();

    // Insert tap
    const { error: insertErr } = await sb.from("taps").insert({
      lighter_id: id,
      visitor_id: body.visitor_id,
      lat: body.lat,
      lng: body.lng,
      accuracy_m: body.accuracy_m ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Insert failed", detail: insertErr.message },
        { status: 500 }
      );
    }

    // Return updated counts (simple)
    const { count: tapCount } = await sb
      .from("taps")
      .select("*", { count: "exact", head: true })
      .eq("lighter_id", id);

    // Unique holders
    const { data: holdersData, error: holdersErr } = await sb
      .from("taps")
      .select("visitor_id")
      .eq("lighter_id", id);

    const uniqueHolders = holdersErr
      ? 0
      : new Set((holdersData ?? []).map((r: any) => r.visitor_id)).size;

    return NextResponse.json({
      ok: true,
      lighter_id: id,
      taps: tapCount ?? 0,
      unique_holders: uniqueHolders,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
