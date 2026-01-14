export const runtime = "nodejs";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url.replace(/\/$/, "");
}

function supabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

async function supabaseRest(path: string, init?: RequestInit) {
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey(),
      Authorization: `Bearer ${supabaseAnonKey()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

function cleanText(v: any, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ").slice(0, maxLen);
  return s.length ? s : null;
}

export async function POST(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    const body = await req.json().catch(() => ({}));

    const lat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
    const lng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);

    const acc =
      typeof body?.accuracy_m === "number" ? body.accuracy_m : Number(body?.accuracy_m);
    const accuracy_m = Number.isFinite(acc) ? Math.round(acc) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response("Missing/invalid lat/lng", { status: 400 });
    }

    const city = cleanText(body?.city, 64);
    const country = cleanText(body?.country, 64);

    // ✅ THIS is what you need for the Owners Log names
    const display_name = cleanText(body?.display_name, 32);

    // Stable visitor id per device via cookie
    const jar = await cookies();
    const existing = jar.get("wml_visitor_id")?.value;
    const visitor_id = existing || randomUUID();

    const insertRes = await supabaseRest("taps", {
      method: "POST",
      body: JSON.stringify({
        lighter_id: lighterId,
        visitor_id,
        display_name, // ✅ WRITES TO DB
        lat,
        lng,
        accuracy_m,
        city,
        country,
        tapped_at: new Date().toISOString(),
      }),
    });

    if (!insertRes.ok) {
      const t = await insertRes.text().catch(() => "");
      return new Response(t || "Failed to insert tap", { status: 500 });
    }

    const inserted = await insertRes.json().catch(() => null);
    const res = Response.json({ ok: true, visitor_id, inserted });

    // Persist visitor id cookie
    res.headers.append(
      "Set-Cookie",
      `wml_visitor_id=${visitor_id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
    );

    return res;
  } catch (e: any) {
    return new Response(e?.message || "Tap failed", { status: 500 });
  }
}
