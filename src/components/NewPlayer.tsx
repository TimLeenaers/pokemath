'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { STARTERS, artworkUrl } from '@/lib/pokemon'
import { createProfile } from '@/lib/storage'
import { Button, Card, LinkButton, Page, PokemonImage } from './ui'

export function NewPlayer() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [starter, setStarter] = useState<number | null>(null)
  const canStart = name.trim().length > 0 && starter !== null

  function start() {
    if (!canStart || starter === null) return
    const profile = createProfile(name, starter)
    router.push(`/player/${profile.id}/settings?next=play`)
  }

  return (
    <Page>
      <div className="mb-4">
        <LinkButton href="/" variant="ghost">
          ‹ Terug
        </LinkButton>
      </div>

      <Card className="p-6">
        <h1 className="text-3xl font-bold">Nieuwe speler</h1>

        <label className="mt-6 block">
          <span className="text-lg font-semibold">Hoe heet je?</span>
          <input
            autoFocus
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && start()}
            placeholder="Je naam"
            className="mt-2 w-full rounded-2xl border-2 border-poke-navy/60 bg-white px-4 py-3 text-2xl md:text-3xl font-semibold outline-none focus:border-poke-blue focus:ring-4 focus:ring-poke-blue/20"
          />
        </label>

        <h2 className="mt-8 text-lg font-semibold">Kies je eerste Pokémon</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STARTERS.map((p) => {
            const selected = starter === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setStarter(p.id)}
                className={`flex flex-col items-center rounded-2xl border-2 p-3 transition-all ${
                  selected
                    ? 'border-poke-red bg-poke-yellow/60 shadow-[0_0_0_4px_rgba(238,21,21,0.25)] scale-105'
                    : 'border-poke-navy/30 bg-white hover:border-poke-navy/70 hover:-translate-y-1'
                }`}
              >
                <div className="aspect-square w-24 md:w-32">
                  <PokemonImage
                    src={artworkUrl(p.id)}
                    alt={p.name}
                    fluid
                    className={selected ? 'anim-float' : ''}
                  />
                </div>
                <span className="mt-1 font-bold">{p.name}</span>
              </button>
            )
          })}
        </div>

        <Button size="xl" className="mt-8 w-full" disabled={!canStart} onClick={start}>
          Start je avontuur!
        </Button>
      </Card>
    </Page>
  )
}
