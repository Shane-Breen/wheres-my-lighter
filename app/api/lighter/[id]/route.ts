import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TEMP MOCK — safe until Supabase re-enabled
  return NextResponse.json({
    birth_city: "Cork",
    birth_country: "Ireland",
    birth_date: "2024-06-21",
    total_distance_km: 2930,
    total_owners: 3,
    hatch_count: 3,
    archetype: "The Night Traveller",
    pattern: "Nocturnal",
    style: "Hidden Courier",
    current_owner_name: "Shane Breen",
  });
}
