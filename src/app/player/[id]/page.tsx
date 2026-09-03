import { PlayerHub } from '@/components/PlayerHub'

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PlayerHub profileId={id} />
}
