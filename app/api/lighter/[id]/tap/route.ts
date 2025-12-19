// app/api/lighter/[id]/tap/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

type TapBody = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lighter_id = params.id;
    if (!lighter_id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await req.json()) as TapBody;

    if (!body?.visitor_id || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sb = supabaseRest();

    // 1) Insert tap event (expects a `taps` table)
    const { error: tapErr } = await sb.from("taps").insert({
      lighter_id,
      visitor_id: body.visitor_id,
      lat: body.lat,
      lng: body.lng,
      accuracy_m: body.accuracy_m ?? null,
      tapped_at: new Date().toISOString(),
    });

    if (tapErr) {
      return NextResponse.json(
        { error: "Failed to insert tap", details: tapErr.message },
        { status: 500 }
      );
    }

    // 2) Optional: update lighter rollups (expects a `lighters` table)
    // If your schema differs, you can remove this block.
    await sb.from("lighters").upsert(
      {
        id: lighter_id,
        last_tapped_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
