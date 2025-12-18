import TapClient from "./TapClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <TapClient lighterId={id} />;
}
