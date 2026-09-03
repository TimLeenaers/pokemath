import { Battle } from '@/components/Battle'

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Battle profileId={id} />
}
