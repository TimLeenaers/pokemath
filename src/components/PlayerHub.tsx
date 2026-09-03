'use client'

import { useRouter } from 'next/navigation'
import { OPERATION_LABELS } from '@/lib/math'
import { xpToEvolve } from '@/lib/pokemon'
import { usePokemon } from '@/lib/pokeapi'
import { deleteProfile, setActivePokemon, useProfile } from '@/lib/storage'
import type { GameSettings, OwnedPokemon, Profile } from '@/lib/types'
import { Button, Card, LinkButton, Loading, Page, PokemonImage, TypeBadge } from './ui'

export function PlayerHub({ profileId }: { profileId: string }) {
  const { profile, ready } = useProfile(profileId)

  if (!ready) {
    return (
      <Page>
        <Loading />
      </Page>
    )
  }
  if (!profile) return <NotFound />
  return <Hub profile={profile} />
}

export function NotFound() {
  return (
    <Page className="items-center justify-center text-center">
      <p className="text-2xl font-bold">Deze speler bestaat niet (meer).</p>
      <LinkButton href="/" className="mt-6">
        Naar het startscherm
      </LinkButton>
    </Page>
  )
}

function describeSettings(s: GameSettings): string {
  const parts = s.operations.map((op) => {
    switch (op) {
      case 'add':
        return `${OPERATION_LABELS.add} tot ${s.addMax}`
      case 'sub':
        return `${OPERATION_LABELS.sub} tot ${s.subMax}`
      case 'mul':
        return `Tafels van ${s.mulTables.join(', ') || '…'}`
      case 'div':
        return `Delen door ${s.divTables.join(', ') || '…'}`
    }
  })
  return parts.join(' · ') || 'Nog niets gekozen'
}

function Hub({ profile }: { profile: Profile }) {
  const router = useRouter()

  function remove() {
    if (window.confirm(`Speler ${profile.name} verwijderen? Score en Pokémon gaan verloren.`)) {
      deleteProfile(profile.id)
      router.replace('/')
    }
  }

  return (
    <Page>
      <div className="flex items-center justify-between">
        <LinkButton href="/" variant="ghost">
          ‹ Andere speler
        </LinkButton>
        <Button variant="ghost" className="text-sm text-poke-red" onClick={remove}>
          Speler verwijderen
        </Button>
      </div>

      <h1 className="mt-4 text-4xl font-bold">Hallo {profile.name}!</h1>

      <Card className="mt-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
        <Stat label="Punten" value={profile.score} icon="⭐" />
        <Stat label="Gewonnen" value={profile.battlesWon} icon="🏆" />
        <Stat label="Juist" value={profile.correct} icon="✅" />
        <Stat label="Fout" value={profile.wrong} icon="❌" />
        <Stat label="Beste reeks" value={profile.bestStreak} icon="🔥" />
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={`/player/${profile.id}/play`} size="xl" className="flex-1">
          ⚔️ Speel!
        </LinkButton>
        <LinkButton href={`/player/${profile.id}/settings`} variant="secondary" size="lg">
          ⚙️ Moeilijkheid
        </LinkButton>
      </div>
      <p className="mt-2 text-center text-sm text-poke-navy/70 sm:text-left">
        {describeSettings(profile.settings)}
      </p>

      <h2 className="mt-8 text-2xl font-bold">
        Jouw Pokémon <span className="text-poke-navy/50">({profile.team.length})</span>
      </h2>
      <p className="text-sm text-poke-navy/70">Tik op een Pokémon om ermee te vechten.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {profile.team.map((owned) => (
          <TeamCard
            key={owned.uid}
            owned={owned}
            active={owned.uid === profile.activeUid}
            onSelect={() => setActivePokemon(profile.id, owned.uid)}
          />
        ))}
      </div>
    </Page>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-blue-50 px-2 py-2">
      <span className="text-xl">{icon}</span>
      <span className="text-2xl font-bold leading-tight">{value}</span>
      <span className="text-xs uppercase tracking-wide text-poke-navy/60">{label}</span>
    </div>
  )
}

function TeamCard({
  owned,
  active,
  onSelect
}: {
  owned: OwnedPokemon
  active: boolean
  onSelect: () => void
}) {
  const info = usePokemon(owned.pokemonId)
  const canEvolve = info ? info.evolvesTo.length > 0 : true
  const needed = info ? xpToEvolve(info.stage) : xpToEvolve(1)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center rounded-2xl border-2 p-3 text-left transition-all ${
        active
          ? 'border-poke-red bg-poke-yellow/50 shadow-[0_0_0_4px_rgba(238,21,21,0.25)]'
          : 'border-poke-navy/30 bg-white/80 hover:-translate-y-1 hover:border-poke-navy/70'
      }`}
    >
      {active && (
        <span className="self-end rounded-full bg-poke-red px-2 py-0.5 text-xs font-bold text-white">
          ACTIEF
        </span>
      )}
      <PokemonImage
        src={info?.artwork ?? ''}
        alt={info?.name ?? ''}
        size={96}
        className={active ? 'anim-float' : ''}
      />
      <span className="mt-1 text-lg font-bold">{info?.name ?? '…'}</span>
      <span className="mt-1 flex flex-wrap justify-center gap-1">
        {info?.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </span>
      <div className="mt-2 w-full">
        {canEvolve ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-poke-navy/15">
              <div
                className="h-full rounded-full bg-poke-blue transition-all"
                style={{ width: `${Math.min(100, (owned.xp / needed) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-poke-navy/60">
              {owned.xp}/{needed} tot evolutie
            </p>
          </>
        ) : (
          <p className="text-center text-xs font-semibold text-poke-navy/60">
            ✨ Volledig geëvolueerd
          </p>
        )}
      </div>
    </button>
  )
}
