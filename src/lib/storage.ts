'use client'

import { useSyncExternalStore } from 'react'
import type { GameSettings, OwnedPokemon, Profile } from './types'
import { DEFAULT_SETTINGS } from './math'

/**
 * All player profiles live in localStorage on the device — no database.
 * Multiple children can play on the same device by picking their profile on the home screen.
 */
const STORAGE_KEY = 'poke-math:v1'
const EMPTY: Profile[] = []

let cache: Profile[] | null = null
const listeners = new Set<() => void>()

function read(): Profile[] {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const profiles = raw ? ((JSON.parse(raw) as { profiles: Profile[] }).profiles ?? []) : []
    // Profiles saved by older versions may miss newer settings: fill them with defaults.
    cache = profiles.map((p) => {
      const settings = { ...DEFAULT_SETTINGS, ...p.settings }
      if (settings.mulRange !== 'free') settings.mulRange = 'tables'
      if (settings.divRange !== 'free') settings.divRange = 'tables'
      return { ...p, settings }
    })
  } catch {
    cache = []
  }
  return cache
}

function write(next: Profile[]) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profiles: next }))
  } catch {
    // Storage full or unavailable: keep the in-memory copy so the game keeps working.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const getServerSnapshot = () => EMPTY

/** True once we are rendering on the client (safe to trust localStorage). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function useProfiles(): { profiles: Profile[]; ready: boolean } {
  const profiles = useSyncExternalStore(subscribe, read, getServerSnapshot)
  const ready = useHydrated()
  return { profiles, ready }
}

export function useProfile(id: string): { profile: Profile | null; ready: boolean } {
  const { profiles, ready } = useProfiles()
  return { profile: profiles.find((p) => p.id === id) ?? null, ready }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createProfile(name: string, starterId: number): Profile {
  const starter: OwnedPokemon = {
    uid: uid(),
    pokemonId: starterId,
    xp: 0,
    evolutions: 0,
    caughtAt: Date.now()
  }
  const profile: Profile = {
    id: uid(),
    name: name.trim(),
    createdAt: Date.now(),
    score: 0,
    correct: 0,
    wrong: 0,
    bestStreak: 0,
    battlesWon: 0,
    settings: { ...DEFAULT_SETTINGS },
    team: [starter],
    activeUid: starter.uid
  }
  write([...read(), profile])
  return profile
}

export function updateProfile(id: string, updater: (profile: Profile) => Profile) {
  write(read().map((p) => (p.id === id ? updater(p) : p)))
}

export function saveSettings(id: string, settings: GameSettings) {
  updateProfile(id, (p) => ({ ...p, settings }))
}

export function setActivePokemon(id: string, pokemonUid: string) {
  updateProfile(id, (p) => ({ ...p, activeUid: pokemonUid }))
}

export function deleteProfile(id: string) {
  write(read().filter((p) => p.id !== id))
}

export function activePokemon(profile: Profile): OwnedPokemon {
  return profile.team.find((o) => o.uid === profile.activeUid) ?? profile.team[0]
}
