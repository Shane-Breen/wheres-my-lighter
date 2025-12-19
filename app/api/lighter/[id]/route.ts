// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

export async function GET(_req: Request, context: any) {
  try {
    const id = context?.params?.id as string;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const sb = supabaseRest();

    // Get lighters row (single)
    const lighterRows = await sb.request(
      `/lighters?select=id,archetype,pattern,style,first_city,first_country,first_tapped_at,last_city,last_country,last_tapped_at,total_distance_km,total_owners,longest_possession_days,current_owner_profile_id&` +
        `id=eq.${encodeURIComponent(id)}&limit=1`
    );
    const lighter = lighterRows?.[0] || null;

    // Count unique holders (visitor_id) from taps
    const taps = await sb.request(
      `/taps?select=visitor_id,lat,lng,created_at,city,country&lighter_id=eq.${encodeURIComponent(id)}`
    );

    const uniqueVisitors = new Set<string>();
    for (const t of taps || []) if (t?.visitor_id) uniqueVisitors.add(t.visitor_id);

    const tapCount = (taps || []).length;
    const uniqueCount = uniqueVisitors.size;

    // current owner name (optional)
    let currentOwnerName: string | null = null;
    if (lighter?.current_owner_profile_id) {
      const prof = await sb.request(
        `/profiles?select=id,display_name&` +
          `id=eq.${encodeURIComponent(lighter.current_owner_profile_id)}&limit=1`
      );
      currentOwnerName = prof?.[0]?.display_name ?? null;
    }

    return NextResponse.json({
      id,
      tapCount,
      uniqueOwners: uniqueCount,
      hatchTarget: 5,
      hatched: uniqueCount >= 5,

      birth: {
        city: lighter?.first_city ?? null,
        country: lighter?.first_country ?? null,
        at: lighter?.first_tapped_at ?? null,
      },
      lastSeen: {
        city: lighter?.last_city ?? null,
        country: lighter?.last_country ?? null,
        at: lighter?.last_tapped_at ?? null,
      },

      totals: {
        distanceKm: Number(lighter?.total_distance_km ?? 0),
        totalOwners: Number(lighter?.total_owners ?? uniqueCount),
        longestPossessionDays: Number(lighter?.longest_possession_days ?? 0),
      },

      persona: {
        archetype: lighter?.archetype ?? null,
        pattern: lighter?.pattern ?? null,
        style: lighter?.style ?? null,
        currentOwnerName,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
