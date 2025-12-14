export const dynamic = "force-dynamic";
export const revalidate = 0;

import TapClient from "./TapClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LighterPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main>
      <TapClient lighterId={id} />
    </main>
  );
}
