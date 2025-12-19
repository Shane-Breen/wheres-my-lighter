// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabaseRest";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const visitor_id = String(body.visitor_id || "").trim();
  const display_name = body.display_name ? String(body.display_name).trim() : null;
  const photo_url = body.photo_url ? String(body.photo_url).trim() : null;

  if (!visitor_id) return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });

  const db = supabaseRest();

  // upsert profile by visitor_id
  await db.request(
    "POST",
    `profiles`,
    [{ visitor_id, display_name, photo_url }],
    { Prefer: "resolution=merge-duplicates,return=minimal" }
  );

  return NextResponse.json({ ok: true });
}
