'use client'

import Link from 'next/link'
import { artworkUrl } from '@/lib/pokemon'
import { activePokemon, useProfiles } from '@/lib/storage'
import { Card, Loading, Page, PokemonImage, Pokeball } from './ui'

export function Home() {
  const { profiles, ready } = useProfiles()

  return (
    <Page className="items-center">
      <header className="mt-6 mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-3">
          <Pokeball size={48} className="anim-spin-slow" />
          <h1 className="text-5xl font-bold tracking-tight text-poke-navy drop-shadow-[0_3px_0_#ffcb05]">
            Poké Math
          </h1>
        </div>
        <p className="mt-3 text-lg text-poke-navy/70">Reken je Pokémon naar de overwinning!</p>
      </header>

      {!ready ? (
        <Loading />
      ) : (
        <section className="w-full">
          <h2 className="mb-3 text-center text-2xl font-bold">Wie speelt er?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {profiles.map((profile) => {
              const active = activePokemon(profile)
              return (
                <Link key={profile.id} href={`/player/${profile.id}`} className="group">
                  <Card className="flex items-center gap-4 p-4 transition-transform group-hover:-translate-y-1">
                    <PokemonImage
                      src={artworkUrl(active.pokemonId)}
                      alt=""
                      size={80}
                      className="anim-float"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-2xl font-bold">{profile.name}</p>
                      <p className="text-sm text-poke-navy/70">
                        ⭐ {profile.score} punten · {profile.team.length} Pokémon
                      </p>
                    </div>
                    <span className="text-3xl transition-transform group-hover:translate-x-1">
                      ›
                    </span>
                  </Card>
                </Link>
              )
            })}
            <Link href="/new" className="group">
              <Card className="flex h-full min-h-28 items-center justify-center gap-3 border-dashed bg-white/60 p-4 transition-transform group-hover:-translate-y-1">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-poke-yellow text-3xl font-bold">
                  +
                </span>
                <span className="text-2xl font-bold">Nieuwe speler</span>
              </Card>
            </Link>
          </div>
          {profiles.length === 0 && (
            <p className="mt-6 text-center text-poke-navy/70">
              Nog geen spelers. Maak een nieuwe speler aan om te beginnen!
            </p>
          )}
        </section>
      )}

      <footer className="mt-auto pt-10 text-center text-xs text-poke-navy/50">
        Pokémon-gegevens en afbeeldingen via{' '}
        <a href="https://pokeapi.co" className="underline" target="_blank" rel="noreferrer">
          PokéAPI
        </a>
        . Spelers worden op dit toestel bewaard.
      </footer>
    </Page>
  )
}
