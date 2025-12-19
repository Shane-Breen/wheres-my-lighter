// app/api/lighter/[id]/tap/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export async function POST(req: Request, ctx: any) {
  const lighterId = String(ctx?.params?.id || "").trim();
  if (!lighterId) return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const visitor_id = String(body.visitor_id || "").trim();
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const accuracy_m = typeof body.accuracy_m === "number" ? body.accuracy_m : null;
  const city = body.city ? String(body.city) : null;
  const country = body.country ? String(body.country) : null;

  if (!visitor_id) return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });

  const supabase = supabaseAdmin();

  // Ensure lighter exists
  const { data: lighter, error: lighterErr } = await supabase
    .from("lighters")
    .select("*")
    .eq("id", lighterId)
    .maybeSingle();

  if (lighterErr) return NextResponse.json({ error: lighterErr.message }, { status: 500 });

  if (!lighter) {
    const { error: insErr } = await supabase.from("lighters").insert({ id: lighterId });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Previous last tap (for distance calc)
  const { data: prevTap } = await supabase
    .from("taps")
    .select("lat,lng")
    .eq("lighter_id", lighterId)
    .order("tapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Insert tap
  const { error: tapErr } = await supabase.from("taps").insert({
    lighter_id: lighterId,
    visitor_id,
    lat,
    lng,
    accuracy_m,
    city,
    country,
    tapped_at: new Date().toISOString(),
  });

  if (tapErr) return NextResponse.json({ error: tapErr.message }, { status: 500 });

  // Recompute unique holders + distance increment
  const { data: allTaps, error: tapsErr } = await supabase
    .from("taps")
    .select("visitor_id, lat, lng, city, country, tapped_at")
    .eq("lighter_id", lighterId)
    .order("tapped_at", { ascending: true });

  if (tapsErr) return NextResponse.json({ error: tapsErr.message }, { status: 500 });

  const uniqueHolders = new Set((allTaps || []).map((t) => t.visitor_id).filter(Boolean)).size;

  let distanceIncrement = 0;
  if (
    prevTap &&
    typeof prevTap.lat === "number" &&
    typeof prevTap.lng === "number" &&
    typeof lat === "number" &&
    typeof lng === "number"
  ) {
    distanceIncrement = haversineKm(prevTap.lat, prevTap.lng, lat, lng);
  }

  const first = allTaps?.[0] || null;
  const last = allTaps?.[allTaps.length - 1] || null;

  // Update lighters: birth fields only if empty, last fields always
  const patch: any = {
    last_city: last?.city ?? lighter?.last_city ?? null,
    last_country: last?.country ?? lighter?.last_country ?? null,
    last_tapped_at: last?.tapped_at ?? new Date().toISOString(),
    total_owners: uniqueHolders,
  };

  if (!lighter?.first_tapped_at && first?.tapped_at) patch.first_tapped_at = first.tapped_at;
  if (!lighter?.first_city && first?.city) patch.first_city = first.city;
  if (!lighter?.first_country && first?.country) patch.first_country = first.country;

  // distance: add increment to stored total_distance_km (or recompute later)
  const currentTotal = Number(lighter?.total_distance_km ?? 0);
  patch.total_distance_km = Math.max(0, currentTotal + distanceIncrement);

  const { error: upErr } = await supabase.from("lighters").update(patch).eq("id", lighterId);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    computed: {
      unique_holders: uniqueHolders,
      tap_count: allTaps?.length ?? 0,
      distance_increment_km: distanceIncrement,
    },
  });
}
