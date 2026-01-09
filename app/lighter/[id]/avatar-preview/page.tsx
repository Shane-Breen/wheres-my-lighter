import { headers } from "next/headers";
import { generateAvatarDebug } from "@/lib/avatarEngine";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getLighterData(lighterId: string) {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const base = host ? `${proto}://${host}` : "";

  const res = await fetch(`${base}/api/lighter/${encodeURIComponent(lighterId)}`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load lighter");
  return res.json();
}

function safeHour(ts: any): number | null {
  try {
    if (!ts) return null;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours();
  } catch {
    return null;
  }
}

export default async function AvatarPreviewPage({ params }: PageProps) {
  const { id: lighterId } = await params;
  const data = await getLighterData(lighterId);

  const journey = Array.isArray(data?.journey) ? data.journey : [];
  const totalTaps = journey.length;

  const countries = Array.from(
    new Set(
      journey
        .map((p: any) => p?.country)
        .filter((c: any) => typeof c === "string" && c.trim().le
