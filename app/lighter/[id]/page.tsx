import TapClient from "./TapClient";

export default function Page({ params }: any) {
  const id = params?.id as string;
  return <TapClient id={id} />;
}
