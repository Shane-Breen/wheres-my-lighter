import TapClient from "./TapClient";

export default function Page({ params }: { params: { id: string } }) {
  return <TapClient lighterId={params.id} />;
}
