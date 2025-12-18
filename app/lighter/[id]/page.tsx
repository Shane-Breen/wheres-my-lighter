import TapClient from "./TapClient";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const demo = sp.demo === "1";

  return <TapClient lighterId={id} demo={demo} />;
}
