import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TapBody = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
};

function supabaseAdminLike() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lighter_id = params?.id;

    if (!lighter_id) {
      return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });
    }

    const body = (await req.json()) as TapBody;

    if (!body?.visitor_id) {
      return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });
    }

    // You said: log GPS on first tap — so we REQUIRE lat/lng.
    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { error: "Missing GPS coordinates (lat/lng required)" },
        { status: 400 }
      );
    }

    const sb = supabaseAdminLike();

    const { data, error } = await sb
      .from("taps")
      .insert({
        lighter_id,
        visitor_id: body.visitor_id,
        lat: body.lat,
        lng: body.lng,
        accuracy_m: body.accuracy_m ?? null,
      })
      .select("id, lighter_id, visitor_id, lat, lng, accuracy_m, tapped_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tap: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
