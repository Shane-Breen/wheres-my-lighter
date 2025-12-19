// app/lighter/[id]/page.tsx
import LighterClient from "./ui";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LighterClient lighterId={id} />;
}
