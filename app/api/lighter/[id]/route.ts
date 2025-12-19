import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(_req: Request, context: any) {
  try {
    const lighterId = String(context?.params?.id ?? "");
    if (!lighterId) {
      return NextResponse.json({ ok: false, error: "Missing lighter id" }, { status: 400 });
    }

    // Get taps newest-first (limit keeps it fast; increase later)
    const { data: taps, error } = await supabaseServer
      .from("taps")
      .select("visitor_id,lat,lng,accuracy_m,city,country,place_label,tapped_at")
      .eq("lighter_id", lighterId)
      .order("tapped_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, error: "Fetch failed", details: error }, { status: 500 });
    }

    const list = taps ?? [];
    const tapCount = list.length;

    const last = list[0] ?? null;
    const first = list[tapCount - 1] ?? null;

    const visitorSet = new Set<string>();
    for (const t of list) {
      if (t?.visitor_id) visitorSet.add(String(t.visitor_id));
    }

    return NextResponse.json({
      ok: true,
      lighter_id: lighterId,
      tapCount,
      uniqueOwners: visitorSet.size,
      birth: first
        ? { tapped_at: first.tapped_at, place_label: first.place_label ?? first.country ?? null }
        : null,
      current: last
        ? { tapped_at: last.tapped_at, place_label: last.place_label ?? last.country ?? null }
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
