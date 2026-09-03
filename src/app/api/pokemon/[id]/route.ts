import { NextResponse } from 'next/server'
import type { PokemonInfo } from '@/lib/types'
import { GEN1_MAX, artworkUrl, spriteBackUrl, spriteUrl } from '@/lib/pokemon'

/**
 * Wraps the open PokéAPI (https://pokeapi.co) into one compact payload per Pokémon:
 * name, types, sprites, weaknesses and Gen 1 evolutions. Cached for a day on Vercel.
 */
export const revalidate = 86400

const API = 'https://pokeapi.co/api/v2'
const ONE_DAY = { next: { revalidate: 86400 } }

interface NamedRef {
  name: string
  url: string
}

interface PokemonResponse {
  name: string
  types: { slot: number; type: NamedRef }[]
}

interface SpeciesResponse {
  names: { name: string; language: NamedRef }[]
  evolution_chain: { url: string }
}

interface ChainLink {
  species: NamedRef
  evolves_to: ChainLink[]
}

interface EvolutionChainResponse {
  chain: ChainLink
}

interface TypeResponse {
  damage_relations: {
    double_damage_from: NamedRef[]
    half_damage_from: NamedRef[]
    no_damage_from: NamedRef[]
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, ONE_DAY)
  if (!res.ok) throw new Error(`PokéAPI ${url} antwoordde met ${res.status}`)
  return (await res.json()) as T
}

function idFromUrl(url: string): number {
  return Number(url.match(/\/(\d+)\/?$/)?.[1] ?? 0)
}

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Path of chain links from the root of the evolution chain down to the given species. */
function pathTo(link: ChainLink, id: number, path: ChainLink[] = []): ChainLink[] | null {
  const here = [...path, link]
  if (idFromUrl(link.species.url) === id) return here
  for (const child of link.evolves_to) {
    const found = pathTo(child, id, here)
    if (found) return found
  }
  return null
}

async function computeWeaknesses(types: string[]): Promise<string[]> {
  const relations = await Promise.all(types.map((t) => getJson<TypeResponse>(`${API}/type/${t}`)))
  const multiplier = new Map<string, number>()
  for (const { damage_relations } of relations) {
    for (const { name } of damage_relations.double_damage_from)
      multiplier.set(name, (multiplier.get(name) ?? 1) * 2)
    for (const { name } of damage_relations.half_damage_from)
      multiplier.set(name, (multiplier.get(name) ?? 1) * 0.5)
    for (const { name } of damage_relations.no_damage_from) multiplier.set(name, 0)
  }
  return [...multiplier.entries()].filter(([, m]) => m >= 2).map(([name]) => name)
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: raw } = await context.params
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1 || id > GEN1_MAX) {
    return NextResponse.json({ error: 'Onbekende Pokémon' }, { status: 404 })
  }

  try {
    const [pokemon, species] = await Promise.all([
      getJson<PokemonResponse>(`${API}/pokemon/${id}`),
      getJson<SpeciesResponse>(`${API}/pokemon-species/${id}`)
    ])
    const types = [...pokemon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)
    const [chain, weaknesses] = await Promise.all([
      getJson<EvolutionChainResponse>(species.evolution_chain.url),
      computeWeaknesses(types)
    ])

    const path = pathTo(chain.chain, id) ?? []
    const current = path[path.length - 1]
    // Stage counts Gen 1 ancestors only, so Pikachu (whose chain starts at Gen 2's Pichu) is stage 1.
    const stage = Math.max(1, path.filter((l) => idFromUrl(l.species.url) <= GEN1_MAX).length)
    const evolvesTo = (current?.evolves_to ?? [])
      .map((link) => ({ id: idFromUrl(link.species.url), name: capitalize(link.species.name) }))
      .filter((e) => e.id >= 1 && e.id <= GEN1_MAX)

    const info: PokemonInfo = {
      id,
      name: species.names.find((n) => n.language.name === 'en')?.name ?? capitalize(pokemon.name),
      types,
      sprite: spriteUrl(id),
      spriteBack: spriteBackUrl(id),
      artwork: artworkUrl(id),
      weaknesses,
      evolvesTo,
      stage
    }

    return NextResponse.json(info, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'PokéAPI is even niet bereikbaar' }, { status: 502 })
  }
}
