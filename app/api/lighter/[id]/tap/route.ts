// app/api/lighter/[id]/tap/route.ts

import { NextResponse } from "next/server";

type TapBody = {
  visitor_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  city?: string | null;
  country?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing lighter id" }, { status: 400 });
  }

  let body: TapBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 🔒 TEMPORARY: no database write (compile-proof)
  return NextResponse.json({
    ok: true,
    lighter_id: id,
    tap: {
      visitor_id: body.visitor_id,
      lat: body.lat,
      lng: body.lng,
      accuracy_m: body.accuracy_m ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      timestamp: new Date().toISOString(),
    },
    mode: "demo-no-db",
  });
}
