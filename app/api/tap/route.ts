import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const body = await req.json();

  const lighter_id = String(body.lighter_id || "");
  const phone_id = String(body.phone_id || "");
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lon = typeof body.lon === "number" ? body.lon : null;
  const accuracy_m = typeof body.accuracy_m === "number" ? body.accuracy_m : null;

  if (!lighter_id || !phone_id) {
    return NextResponse.json({ error: "Missing lighter_id or phone_id" }, { status: 400 });
  }

  const { error } = await supabase.from("taps").insert({
    lighter_id,
    phone_id,
    lat,
    lon,
    accuracy_m
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
