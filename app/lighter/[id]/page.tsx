import TapClient from './TapClient';

type PageProps = {
  params: {
    id: string;
  };
};

export default function Page({ params }: PageProps) {
  const lighterId = params.id;

  return <TapClient lighterId={lighterId} />;
}
