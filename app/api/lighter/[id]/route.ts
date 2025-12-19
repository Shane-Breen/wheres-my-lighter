// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseRest";

type TapRow = {
  lighter_id: string;
  visitor_id: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
  city: string | null;
  country: string | null;
};

type ProfileRow = {
  visitor_id: string;
  display_name: string | null;
  photo_url: string | null;
};

export async function GET(_req: Request, ctx: unknown) {
  const id = (ctx as any)?.params?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabaseRest();

  // latest 200 taps for this lighter
  const taps = await db.request<TapRow[]>(
    "GET",
    `tap_events?lighter_id=eq.${encodeURIComponent(id)}&select=lighter_id,visitor_id,created_at,lat,lng,accuracy_m,city,country&order=created_at.desc&limit=200`
  );

  const uniqueVisitors = new Set(taps.map((t) => t.visitor_id)).size;
  const hatched = uniqueVisitors >= 5;

  const lastTap = taps[0] || null;
  const firstTap = taps[taps.length - 1] || null;

  // current holder name (if profile exists)
  let currentHolder: { display_name: string | null; photo_url: string | null } = {
    display_name: null,
    photo_url: null,
  };

  if (lastTap?.visitor_id) {
    const profiles = await db.request<ProfileRow[]>(
      "GET",
      `profiles?visitor_id=eq.${encodeURIComponent(lastTap.visitor_id)}&select=visitor_id,display_name,photo_url&limit=1`
    );
    currentHolder = profiles?.[0] || currentHolder;
  }

  // Lighter meta (if you have it)
  // If the table doesn't exist or row missing, we just use safe defaults.
  let meta: any = null;
  try {
    const rows = await db.request<any[]>(
      "GET",
      `lighters?id=eq.${encodeURIComponent(id)}&select=id,archetype,pattern,style,total_distance_km,longest_possession_days,total_owners&limit=1`
    );
    meta = rows?.[0] || null;
  } catch {
    meta = null;
  }

  const out = {
    lighter_id: id,

    birth: firstTap
      ? {
          city: firstTap.city,
          country: firstTap.country,
          tapped_at: firstTap.created_at,
        }
      : null,

    last_seen: lastTap
      ? {
          city: lastTap.city,
          country: lastTap.country,
          tapped_at: lastTap.created_at,
          accuracy_m: lastTap.accuracy_m,
        }
      : null,

    owners: {
      unique_holders: uniqueVisitors,
    },

    travel: {
      // Prefer stored value if present; otherwise just show 0 until we add distance calc in tap route.
      total_distance_km: Number(meta?.total_distance_km ?? 0),
    },

    hatch: {
      taps: uniqueVisitors,
      required: 5,
      hatched,
    },

    current_holder: {
      name: currentHolder.display_name || "Anonymous",
      photo_url: currentHolder.photo_url || null,
    },

    archetype: {
      title: meta?.archetype || (hatched ? "Hidden Courier" : "Embryo"),
      pattern: meta?.pattern || (hatched ? "Nocturnal" : "Unformed"),
      style: meta?.style || (hatched ? "Passed hand to hand" : "Unknown"),
      longest_possession_days: Number(meta?.longest_possession_days ?? 0),
      total_owners: Number(meta?.total_owners ?? uniqueVisitors),
    },
  };

  return NextResponse.json(out);
}
