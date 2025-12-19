export const runtime = "nodejs";

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
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

export async function GET(req: Request, context: any) {
  const lighterId = context?.params?.id as string;

  try {
    // total taps
    const countRes = await supabaseRest(
      `taps?select=id&lighter_id=eq.${encodeURIComponent(lighterId)}`,
      { method: "GET" }
    );
    const taps = await countRes.json();
    const total_taps = Array.isArray(taps) ? taps.length : 0;

    // unique holders
    const uniqRes = await supabaseRest(
      `taps?select=visitor_id&lighter_id=eq.${encodeURIComponent(lighterId)}`,
      { method: "GET" }
    );
    const uniqRows = await uniqRes.json();
    const set = new Set<string>();
    if (Array.isArray(uniqRows)) {
      for (const r of uniqRows) if (r?.visitor_id) set.add(String(r.visitor_id));
    }
    const unique_holders = set.size;

    // birth tap (first ever)
    const birthRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.asc&limit=1`,
      { method: "GET" }
    );
    const birthArr = await birthRes.json();
    const birth_tap = Array.isArray(birthArr) && birthArr[0] ? birthArr[0] : null;

    // latest tap
    const latestRes = await supabaseRest(
      `taps?select=id,lighter_id,visitor_id,lat,lng,accuracy_m,city,country,tapped_at&lighter_id=eq.${encodeURIComponent(
        lighterId
      )}&order=tapped_at.desc&limit=1`,
      { method: "GET" }
    );
    const latestArr = await latestRes.json();
    const latest_tap = Array.isArray(latestArr) && latestArr[0] ? latestArr[0] : null;

    return Response.json({
      ok: true,
      lighter_id: lighterId,
      total_taps,
      unique_holders,
      birth_tap,
      latest_tap,
    });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message ?? "Failed", details: String(e) },
      { status: 500 }
    );
  }
}
