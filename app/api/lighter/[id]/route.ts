// app/api/lighter/[id]/tap/route.ts
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request, context: any) {
  try {
    const id = context?.params?.id as string;
    if (!id) return Response.json({ error: "Missing lighter id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const visitor_id = String(body.visitor_id || "");
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const accuracy_m = body.accuracy_m == null ? null : Number(body.accuracy_m);

    if (!visitor_id) return Response.json({ error: "Missing visitor_id" }, { status: 400 });
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return Response.json({ error: "Missing/invalid lat/lng" }, { status: 400 });
    }

    // 1) Insert tap
    const { error: tapErr } = await supabaseServer.from("taps").insert({
      lighter_id: id,
      visitor_id,
      lat,
      lng,
      accuracy_m,
      tapped_at: new Date().toISOString(),
    });

    if (tapErr) {
      return Response.json({ error: tapErr.message }, { status: 500 });
    }

    // 2) Recompute counts (unique holders)
    const { data: uniq, error: uniqErr } = await supabaseServer
      .from("taps")
      .select("visitor_id")
      .eq("lighter_id", id);

    if (uniqErr) return Response.json({ error: uniqErr.message }, { status: 500 });

    const uniqueVisitors = new Set((uniq || []).map((r: any) => r.visitor_id)).size;

    // 3) Ensure lighter exists + update total_owners
    const { error: upErr } = await supabaseServer
      .from("lighters")
      .upsert(
        { id, total_owners: uniqueVisitors },
        { onConflict: "id" }
      );

    if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

    return Response.json({ ok: true, lighter_id: id, total_owners: uniqueVisitors });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
