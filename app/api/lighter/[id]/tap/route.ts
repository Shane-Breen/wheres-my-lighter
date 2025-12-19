import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseServer";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lighterId = params.id;
    const body = await req.json();

    const { visitor_id, lat, lng, accuracy_m } = body;

    if (!visitor_id || lat == null || lng == null) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const res = await supabaseRest(
      "taps",
      {
        lighter_id: lighterId,
        visitor_id,
        lat,
        lng,
        accuracy_m,
      },
      "POST"
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: "Insert failed", details: text },
        { status: 500 }
      );
    }

    const tap = await res.json();
    return NextResponse.json({ ok: true, tap });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message ?? "Server error" },
      { status: 500 }
    );
  }
}
