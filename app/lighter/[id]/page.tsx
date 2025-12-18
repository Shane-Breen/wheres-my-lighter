import TapClient from "./TapClient";

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  return <TapClient lighterId={params.id} />;
}
