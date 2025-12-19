// app/api/lighter/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const sb = supabaseRest();

    // Fetch taps for this lighter (latest first)
    const { data: taps, error } = await sb
      .from("taps")
      .select("visitor_id, lat, lng, accuracy_m, city, country, created_at")
      .eq("lighter_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Query failed", detail: error.message },
        { status: 500 }
      );
    }

    const uniqueHolders = new Set((taps ?? []).map((t: any) => t.visitor_id)).size;

    return NextResponse.json({
      ok: true,
      lighter_id: id,
      taps: taps ?? [],
      tap_count: (taps ?? []).length,
      unique_holders: uniqueHolders,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
