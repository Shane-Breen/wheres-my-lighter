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

function cleanName(v: any, max = 32): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ").slice(0, max);
  return s.length ? s : null;
}

export async function POST(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    const body = await req.json().catch(() => ({}));

    const lat = typeof body?.lat === "number" ? body.lat : Number(body?.lat);
    const lng = typeof body?.lng === "number" ? body.lng : Number(body?.lng);

    const accuracyRaw =
      typeof body?.accuracy_m === "number" ? body.accuracy_m : Number(body?.accuracy_m);
    const accuracy_m = Number.isFinite(accuracyRaw) ? Math.round(accuracyRaw) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response("Missing/invalid lat/lng", { status: 400 });
    }

    const city = cleanName(body?.city, 64);
    const country = cleanName(body?.country, 64);

    // NEW: optional display name / alias
    const display_name = cleanName(body?.display_name, 32);

    // stable visitor id per device (cookie)
    const jar = await cookies();
    const existing = jar.get("wml_visitor_id")?.value;
    const visitor_id = existing || randomUUID();

    const insertRes = await supabaseRest("taps", {
      method: "POST",
      body: JSON.stringify({
        lighter_id: lighterId,
        visitor_id,
        display_name,
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

    // persist visitor id cookie
    res.headers.append(
      "Set-Cookie",
      `wml_visitor_id=${visitor_id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
    );

    return res;
  } catch (e: any) {
    return new Response(e?.message || "Tap failed", { status: 500 });
  }
}
