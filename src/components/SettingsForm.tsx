'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  MAX_OPTIONS,
  OPERATION_LABELS,
  OPERATION_ORDER,
  OPERATION_SYMBOLS,
  TABLE_OPTIONS,
  usableOperations
} from '@/lib/math'
import { saveSettings, useProfile } from '@/lib/storage'
import type { GameSettings, Operation, Profile } from '@/lib/types'
import { NotFound } from './PlayerHub'
import { Button, Card, LinkButton, Loading, Page } from './ui'

export function SettingsForm({ profileId, next }: { profileId: string; next?: string }) {
  const { profile, ready } = useProfile(profileId)

  if (!ready) {
    return (
      <Page>
        <Loading />
      </Page>
    )
  }
  if (!profile) return <NotFound />
  return <Form profile={profile} next={next} />
}

const OPERATION_HINTS: Record<Operation, string> = {
  add: 'Optellen tot maximaal…',
  sub: 'Aftrekken van getallen tot…',
  mul: 'Welke tafels?',
  div: 'Delen door welke tafels?'
}

function Form({ profile, next }: { profile: Profile; next?: string }) {
  const router = useRouter()
  const [settings, setSettings] = useState<GameSettings>(profile.settings)

  const usable = usableOperations(settings)
  const incomplete = settings.operations.filter((op) => !usable.includes(op))
  const valid = settings.operations.length > 0 && incomplete.length === 0

  function toggleOperation(op: Operation) {
    setSettings((s) => ({
      ...s,
      operations: s.operations.includes(op)
        ? s.operations.filter((o) => o !== op)
        : OPERATION_ORDER.filter((o) => o === op || s.operations.includes(o))
    }))
  }

  function toggleTable(key: 'mulTables' | 'divTables', table: number) {
    setSettings((s) => {
      const has = s[key].includes(table)
      const list = has ? s[key].filter((t) => t !== table) : [...s[key], table]
      return { ...s, [key]: list.sort((a, b) => a - b) }
    })
  }

  function setAllTables(key: 'mulTables' | 'divTables', all: boolean) {
    setSettings((s) => ({ ...s, [key]: all ? [...TABLE_OPTIONS] : [] }))
  }

  function save() {
    if (!valid) return
    saveSettings(profile.id, settings)
    router.push(next === 'play' ? `/player/${profile.id}/play` : `/player/${profile.id}`)
  }

  return (
    <Page>
      <div className="mb-4">
        <LinkButton href={`/player/${profile.id}`} variant="ghost">
          ‹ Terug
        </LinkButton>
      </div>

      <h1 className="text-3xl font-bold">Moeilijkheid voor {profile.name}</h1>
      <p className="mt-1 text-poke-navy/70">
        Kies één bewerking, of vink er meerdere aan om te mixen.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {OPERATION_ORDER.map((op) => {
          const enabled = settings.operations.includes(op)
          return (
            <Card key={op} className={`p-4 transition-opacity ${enabled ? '' : 'opacity-70'}`}>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleOperation(op)}
                  className="h-6 w-6 accent-poke-red"
                />
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-poke-yellow text-2xl font-bold">
                  {OPERATION_SYMBOLS[op]}
                </span>
                <span className="text-2xl font-bold">{OPERATION_LABELS[op]}</span>
              </label>

              {enabled && (
                <div className="mt-4 border-t border-poke-navy/15 pt-4">
                  <p className="mb-2 font-semibold text-poke-navy/80">{OPERATION_HINTS[op]}</p>
                  {op === 'add' || op === 'sub' ? (
                    <PillGroup
                      options={MAX_OPTIONS}
                      selected={[op === 'add' ? settings.addMax : settings.subMax]}
                      onToggle={(v) =>
                        setSettings((s) =>
                          op === 'add' ? { ...s, addMax: v } : { ...s, subMax: v }
                        )
                      }
                    />
                  ) : (
                    <>
                      <PillGroup
                        options={TABLE_OPTIONS}
                        selected={op === 'mul' ? settings.mulTables : settings.divTables}
                        onToggle={(v) => toggleTable(op === 'mul' ? 'mulTables' : 'divTables', v)}
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="ghost"
                          className="text-sm"
                          onClick={() =>
                            setAllTables(op === 'mul' ? 'mulTables' : 'divTables', true)
                          }
                        >
                          Alle tafels
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-sm"
                          onClick={() =>
                            setAllTables(op === 'mul' ? 'mulTables' : 'divTables', false)
                          }
                        >
                          Geen
                        </Button>
                      </div>
                      {incomplete.includes(op) && (
                        <p className="mt-2 text-sm font-semibold text-poke-red">
                          Kies minstens één tafel.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {settings.operations.length === 0 && (
        <p className="mt-4 text-center font-semibold text-poke-red">Kies minstens één bewerking.</p>
      )}

      <Button size="xl" className="mt-6 w-full" disabled={!valid} onClick={save}>
        {next === 'play' ? '⚔️ Opslaan en spelen!' : 'Opslaan'}
      </Button>
    </Page>
  )
}

function PillGroup({
  options,
  selected,
  onToggle
}: {
  options: number[]
  selected: number[]
  onToggle: (value: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((value) => {
        const on = selected.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`min-w-14 rounded-xl border-2 px-3 py-2 text-lg font-bold transition-all ${
              on
                ? 'border-poke-navy bg-poke-blue text-white shadow-[0_3px_0_#1b3c74]'
                : 'border-poke-navy/30 bg-white text-poke-navy hover:border-poke-navy/70'
            }`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}
