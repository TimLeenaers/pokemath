'use client'

import { useEffect, useState } from 'react'
import type { PokemonInfo } from './types'

/**
 * Client-side access to our own /api/pokemon/[id] route (which wraps PokéAPI).
 * Results are memoised per Pokémon id for the lifetime of the page.
 */
const memory = new Map<number, Promise<PokemonInfo>>()

export function fetchPokemon(id: number): Promise<PokemonInfo> {
  const cached = memory.get(id)
  if (cached) return cached

  const request = fetch(`/api/pokemon/${id}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Pokémon ${id} kon niet geladen worden (${res.status})`)
      return (await res.json()) as PokemonInfo
    })
    .catch((error) => {
      memory.delete(id)
      throw error
    })

  memory.set(id, request)
  return request
}

export function usePokemon(id: number | null): PokemonInfo | null {
  const [state, setState] = useState<{ id: number; info: PokemonInfo } | null>(null)

  useEffect(() => {
    if (id == null) return
    let alive = true
    fetchPokemon(id)
      .then((info) => {
        if (alive) setState({ id, info })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  return state && state.id === id ? state.info : null
}
