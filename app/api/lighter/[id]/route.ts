// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs"; // ensures this runs in Node (not Edge)

// NOTE: In Next 15, the route handler context typing can be finicky.
// Using `ctx: any` avoids the build-time type mismatch.
export async function GET(_req: Request, ctx: any) {
  const id = String(ctx?.params?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // 1) Load lighter row
  const { data: lighter, error: lighterErr } = await supabase
    .from("lighters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (lighterErr) {
    return NextResponse.json({ error: lighterErr.message }, { status: 500 });
  }

  if (!lighter) {
    return NextResponse.json({ error: "Lighter not found" }, { status: 404 });
  }

  // 2) Load tap history (newest first)
  const { data: taps, error: tapsErr } = await supabase
    .from("taps")
    .select("*")
    .eq("lighter_id", id)
    .order("tapped_at", { ascending: false })
    .limit(200);

  if (tapsErr) {
    return NextResponse.json({ error: tapsErr.message }, { status: 500 });
  }

  // 3) Unique holders count (visitor_id = generated per-device id)
  const uniqueHolders = new Set((taps || []).map((t) => t.visitor_id).filter(Boolean)).size;

  // 4) Birth + last seen from taps (or fallback to columns on lighters)
  const lastTap = (taps && taps[0]) || null;
  const firstTap = (taps && taps[taps.length - 1]) || null;

  const birth = {
    city: lighter.first_city ?? firstTap?.city ?? null,
    country: lighter.first_country ?? firstTap?.country ?? null,
    tapped_at: lighter.first_tapped_at ?? firstTap?.tapped_at ?? null,
  };

  const lastSeen = {
    city: lighter.last_city ?? lastTap?.city ?? null,
    country: lighter.last_country ?? lastTap?.country ?? null,
    tapped_at: lighter.last_tapped_at ?? lastTap?.tapped_at ?? null,
  };

  // 5) Total distance (stored as numeric km in lighters.total_distance_km)
  const totalDistanceKm = Number(lighter.total_distance_km ?? 0);

  return NextResponse.json({
    lighter: {
      id: lighter.id,
      archetype: lighter.archetype,
      pattern: lighter.pattern,
      style: lighter.style,
      longest_possession_days: lighter.longest_possession_days ?? 0,
      total_owners: lighter.total_owners ?? uniqueHolders,
      total_distance_km: totalDistanceKm,
      birth,
      lastSeen,
    },
    taps: taps || [],
    computed: {
      unique_holders: uniqueHolders,
      tap_count: (taps || []).length,
    },
  });
}
