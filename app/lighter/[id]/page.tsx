import JourneyClient from './JourneyClient'

export default function Page({ params }: { params: { id: string } }) {
  return <JourneyClient lighterId={params.id} />
}
