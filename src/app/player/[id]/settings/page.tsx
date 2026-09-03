import { SettingsForm } from '@/components/SettingsForm'

export default async function SettingsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { id } = await params
  const { next } = await searchParams
  return <SettingsForm profileId={id} next={next} />
}
