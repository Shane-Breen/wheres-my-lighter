import TapClient from './TapClient';

type PageProps = {
  params: {
    id: string;
  };
};

export default function Page({ params }: PageProps) {
  return <TapClient lighterId={params.id} />;
}
