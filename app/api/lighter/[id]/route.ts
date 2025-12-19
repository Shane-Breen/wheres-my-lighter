// app/api/lighter/[id]/route.ts
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(_req: Request, context: any) {
  const id = context?.params?.id as string;
  if (!id) return Response.json({ error: "Missing lighter id" }, { status: 400 });

  // Lighter row
  const { data: lighter, error: lErr } = await supabaseServer
    .from("lighters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (lErr) return Response.json({ error: lErr.message }, { status: 500 });

  // Latest taps
  const { data: taps, error: tErr } = await supabaseServer
    .from("taps")
    .select("visitor_id, lat, lng, accuracy_m, tapped_at")
    .eq("lighter_id", id)
    .order("tapped_at", { ascending: false })
    .limit(50);

  if (tErr) return Response.json({ error: tErr.message }, { status: 500 });

  const uniqueOwners = new Set((taps || []).map((r: any) => r.visitor_id)).size;
  const tapCount = (taps || []).length;

  return Response.json({
    id,
    lighter: lighter || { id, total_owners: uniqueOwners },
    tapCount,
    uniqueOwners,
    taps: taps || [],
  });
}
