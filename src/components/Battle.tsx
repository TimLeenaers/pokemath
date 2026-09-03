'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { OPERATION_LABELS, generateQuestion, pick } from '@/lib/math'
import { PLAYER_HEARTS, opponentMaxHp, randomOpponentId, xpToEvolve } from '@/lib/pokemon'
import { fetchPokemon, usePokemon } from '@/lib/pokeapi'
import { activePokemon, uid, updateProfile, useProfile } from '@/lib/storage'
import type { PokemonInfo, Profile, Question } from '@/lib/types'
import { NotFound } from './PlayerHub'
import { Button, Card, LinkButton, Loading, Page, PokemonImage, TypeBadge } from './ui'

type Phase = 'loading' | 'question' | 'feedback' | 'evolving' | 'won' | 'lost' | 'error'

interface Feedback {
  chosen: number
  correct: boolean
  effective: boolean
}

interface Evolution {
  from: PokemonInfo
  to: PokemonInfo
}

const FEEDBACK_MS = 1500

export function Battle({ profileId }: { profileId: string }) {
  const { profile, ready } = useProfile(profileId)

  if (!ready) {
    return (
      <Page>
        <Loading />
      </Page>
    )
  }
  if (!profile) return <NotFound />
  return <Arena profile={profile} />
}

function Arena({ profile }: { profile: Profile }) {
  const owned = activePokemon(profile)
  const player = usePokemon(owned.pokemonId)

  const [opponent, setOpponent] = useState<PokemonInfo | null>(null)
  const [oppHp, setOppHp] = useState(0)
  const [oppMax, setOppMax] = useState(1)
  const [hearts, setHearts] = useState(PLAYER_HEARTS)
  const [question, setQuestion] = useState<Question | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [streak, setStreak] = useState(0)
  const [evolution, setEvolution] = useState<Evolution | null>(null)
  const [caughtNew, setCaughtNew] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const battleSeq = useRef(0)
  const lastOpponentId = useRef<number | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Fetches a fresh wild opponent and hands out the first question. */
  const loadOpponent = useCallback(async () => {
    const seq = ++battleSeq.current
    try {
      const info = await fetchPokemon(randomOpponentId(lastOpponentId.current))
      if (seq !== battleSeq.current) return
      lastOpponentId.current = info.id
      const max = opponentMaxHp(info.stage)
      setOpponent(info)
      setOppMax(max)
      setOppHp(max)
      setQuestion(generateQuestion(profile.settings))
      setPhase('question')
    } catch (e) {
      if (seq !== battleSeq.current) return
      setError(e instanceof Error ? e.message : 'Er ging iets mis')
      setPhase('error')
    }
  }, [profile.settings])

  // Initial state already matches a fresh battle, so only the fetch is needed on mount.
  useEffect(() => {
    void loadOpponent()
  }, [loadOpponent])

  /** Resets the battle state (used by the "next opponent" / "retry" buttons). */
  function startBattle() {
    setPhase('loading')
    setFeedback(null)
    setCaughtNew(false)
    setHearts(PLAYER_HEARTS)
    void loadOpponent()
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  function nextQuestion() {
    setFeedback(null)
    setQuestion(generateQuestion(profile.settings))
    setPhase('question')
  }

  function winBattle(defeated: PokemonInfo) {
    let isNew = false
    updateProfile(profile.id, (p) => {
      isNew = !p.team.some((o) => o.pokemonId === defeated.id)
      return {
        ...p,
        score: p.score + 50,
        battlesWon: p.battlesWon + 1,
        team: isNew
          ? [
              ...p.team,
              { uid: uid(), pokemonId: defeated.id, xp: 0, evolutions: 0, caughtAt: Date.now() }
            ]
          : p.team
      }
    })
    setCaughtNew(isNew)
    setFeedback(null)
    setPhase('won')
  }

  function continueBattle(oppHpNow: number, heartsNow: number, defeated: PokemonInfo) {
    if (oppHpNow <= 0) return winBattle(defeated)
    if (heartsNow <= 0) {
      setFeedback(null)
      setPhase('lost')
      return
    }
    nextQuestion()
  }

  async function evolve(from: PokemonInfo, toId: number, ownedUid: string) {
    const to = await fetchPokemon(toId)
    updateProfile(profile.id, (p) => ({
      ...p,
      team: p.team.map((o) =>
        o.uid === ownedUid ? { ...o, pokemonId: to.id, xp: 0, evolutions: o.evolutions + 1 } : o
      )
    }))
    setEvolution({ from, to })
    setFeedback(null)
    setPhase('evolving')
  }

  function answer(choice: number) {
    if (phase !== 'question' || !question || !opponent || !player) return

    const correct = choice === question.answer
    const effective = correct && player.types.some((t) => opponent.weaknesses.includes(t))
    setFeedback({ chosen: choice, correct, effective })
    setPhase('feedback')

    let nextOppHp = oppHp
    let nextHearts = hearts
    let evolveTo: number | null = null

    if (correct) {
      nextOppHp = Math.max(0, oppHp - (effective ? 2 : 1))
      const newStreak = streak + 1
      const points = 10 + (newStreak >= 3 ? 5 : 0) + (effective ? 5 : 0)
      const newXp = owned.xp + 1
      if (player.evolvesTo.length > 0 && newXp >= xpToEvolve(player.stage)) {
        evolveTo = pick(player.evolvesTo).id
      }
      setStreak(newStreak)
      setOppHp(nextOppHp)
      updateProfile(profile.id, (p) => ({
        ...p,
        score: p.score + points,
        correct: p.correct + 1,
        bestStreak: Math.max(p.bestStreak, newStreak),
        team: p.team.map((o) => (o.uid === owned.uid ? { ...o, xp: newXp } : o))
      }))
    } else {
      nextHearts = hearts - 1
      setStreak(0)
      setHearts(nextHearts)
      updateProfile(profile.id, (p) => ({ ...p, wrong: p.wrong + 1 }))
    }

    const ownedUid = owned.uid
    timer.current = setTimeout(() => {
      if (evolveTo !== null) {
        evolve(player, evolveTo, ownedUid).catch(() =>
          continueBattle(nextOppHp, nextHearts, opponent)
        )
      } else {
        continueBattle(nextOppHp, nextHearts, opponent)
      }
    }, FEEDBACK_MS)
  }

  const playerAnim = feedback ? (feedback.correct ? 'anim-attack-player' : 'anim-hit') : ''
  const opponentAnim =
    phase === 'won'
      ? 'anim-faint'
      : feedback
        ? feedback.correct
          ? 'anim-hit'
          : 'anim-attack-opponent'
        : 'anim-float'

  const showQuestion = (phase === 'question' || phase === 'feedback') && question && opponent

  return (
    <Page wide className="battle-page">
      <header className="flex items-center justify-between">
        <LinkButton href={`/player/${profile.id}`} variant="ghost">
          ‹ Stop
        </LinkButton>
        <div className="flex items-center gap-4 text-xl font-bold md:text-2xl">
          {streak >= 2 && <span className="anim-pop">🔥 {streak}</span>}
          <span>⭐ {profile.score}</span>
        </div>
      </header>

      {/* Portrait: arena above the question. Landscape tablet (lg): side by side, no scrolling. */}
      <div className="mt-3 grid flex-1 grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex flex-col justify-center overflow-hidden bg-gradient-to-b from-sky-100 to-lime-100 p-3 sm:p-4">
          {phase === 'loading' || !opponent ? (
            <Loading text="Een wilde Pokémon verschijnt…" />
          ) : (
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-2">
              <InfoBox
                name={opponent.name}
                types={opponent.types}
                extra={<HpBar hp={oppHp} max={oppMax} />}
              />
              <Sprite
                key={`opp-${opponent.id}`}
                src={opponent.sprite}
                alt={opponent.name}
                anim={opponentAnim}
              />

              <Sprite
                key={`me-${player?.id ?? 'loading'}`}
                src={player?.spriteBack}
                alt={player?.name ?? ''}
                anim={playerAnim}
              />
              <InfoBox
                name={player?.name ?? '…'}
                types={player?.types ?? []}
                extra={
                  <>
                    <Hearts hearts={hearts} />
                    {player && (
                      <XpBar
                        xp={owned.xp}
                        needed={xpToEvolve(player.stage)}
                        canEvolve={player.evolvesTo.length > 0}
                      />
                    )}
                  </>
                }
              />
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-center p-4 sm:p-5">
          {showQuestion && (
            <>
              <p className="text-center text-sm font-semibold uppercase tracking-wide text-poke-navy/60 md:text-base">
                {opponent.name} vraagt · {OPERATION_LABELS[question.op]}
              </p>
              <p className="mt-2 text-center text-[clamp(2.5rem,9vw,4.5rem)] font-bold leading-tight lg:text-[clamp(2.5rem,4.5vw,4.5rem)]">
                {question.text} = ?
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:mt-5 md:gap-4">
                {question.choices.map((choice) => (
                  <ChoiceButton
                    key={choice}
                    value={choice}
                    answer={question.answer}
                    feedback={feedback}
                    onClick={() => answer(choice)}
                  />
                ))}
              </div>
              <p className="mt-3 min-h-8 text-center text-lg font-semibold md:mt-4 md:text-xl">
                {feedback ? (
                  feedback.correct ? (
                    <span className="text-green-700">
                      Goed zo! {player?.name} valt aan!{' '}
                      {feedback.effective && (
                        <span className="text-poke-red">Super effectief!</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-poke-red">
                      Oei! Het juiste antwoord was {question.answer}. {opponent.name} valt aan!
                    </span>
                  )
                ) : (
                  <span className="text-poke-navy/50">Kies het juiste antwoord</span>
                )}
              </p>
            </>
          )}

          {phase === 'won' && opponent && (
            <div className="flex flex-col items-center text-center anim-pop">
              <p className="text-2xl font-bold md:text-3xl">
                🏆 Je hebt {opponent.name} verslagen!
              </p>
              <p className="mt-1 text-lg text-poke-navy/70">+50 punten</p>
              {caughtNew ? (
                <div className="mt-3 flex flex-col items-center">
                  <div className="aspect-square w-[min(30vw,140px)] lg:w-[min(12vw,22vh)]">
                    <PokemonImage src={opponent.artwork} alt="" fluid className="anim-float" />
                  </div>
                  <p className="text-xl font-bold text-poke-red md:text-2xl">
                    Gevangen! {opponent.name} is nu van jou.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-poke-navy/70">Je had {opponent.name} al in je team.</p>
              )}
              <Button size="xl" className="mt-5 w-full sm:w-auto" onClick={startBattle}>
                Volgende tegenstander ›
              </Button>
            </div>
          )}

          {phase === 'lost' && (
            <div className="flex flex-col items-center text-center anim-pop">
              <p className="text-2xl font-bold md:text-3xl">
                😵 {player?.name ?? 'Je Pokémon'} is uitgeput…
              </p>
              <p className="mt-2 text-lg text-poke-navy/70">Geen zorgen, probeer het nog eens!</p>
              <div className="mt-5 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button size="xl" onClick={startBattle}>
                  Opnieuw proberen
                </Button>
                <LinkButton href={`/player/${profile.id}`} variant="secondary" size="lg">
                  Ander Pokémon kiezen
                </LinkButton>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center text-center">
              <p className="text-2xl font-bold">Oeps, de Pokémon kwamen niet opdagen.</p>
              <p className="mt-2 text-poke-navy/70">{error}</p>
              <Button size="lg" className="mt-6" onClick={startBattle}>
                Probeer opnieuw
              </Button>
            </div>
          )}

          {(phase === 'loading' || phase === 'evolving') && <Loading />}
        </Card>
      </div>

      {phase === 'evolving' && evolution && (
        <EvolutionOverlay
          evolution={evolution}
          onDone={() => continueBattle(oppHp, hearts, opponent as PokemonInfo)}
        />
      )}
    </Page>
  )
}

/** Battle sprite that scales with the screen: phone width, tablet width, or landscape height. */
function Sprite({ src, alt, anim }: { src?: string; alt: string; anim: string }) {
  return (
    <div className="flex items-end justify-center">
      <div className="aspect-square w-[min(38vw,150px)] md:w-[220px] lg:w-[min(20vw,32vh)]">
        {src && <PokemonImage src={src} alt={alt} fluid pixelated className={anim} />}
      </div>
    </div>
  )
}

function InfoBox({
  name,
  types,
  extra
}: {
  name: string
  types: string[]
  extra: React.ReactNode
}) {
  return (
    <div className="self-center rounded-2xl border-2 border-poke-navy/60 bg-white/90 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xl font-bold md:text-2xl">{name}</p>
        {types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-1">{extra}</div>
    </div>
  )
}

function HpBar({ hp, max }: { hp: number; max: number }) {
  const ratio = hp / max
  const color = ratio > 0.5 ? 'bg-green-500' : ratio > 0.25 ? 'bg-yellow-400' : 'bg-poke-red'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-poke-navy/60">HP</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-poke-navy/15 md:h-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-poke-navy/60">
        {hp}/{max}
      </span>
    </div>
  )
}

function Hearts({ hearts }: { hearts: number }) {
  return (
    <div className="flex gap-1 text-xl md:text-2xl">
      {Array.from({ length: PLAYER_HEARTS }, (_, i) => (
        <span key={i} className={i < hearts ? '' : 'opacity-30 grayscale'}>
          ❤️
        </span>
      ))}
    </div>
  )
}

function XpBar({ xp, needed, canEvolve }: { xp: number; needed: number; canEvolve: boolean }) {
  if (!canEvolve) {
    return <p className="text-xs font-semibold text-poke-navy/60">✨ Volledig geëvolueerd</p>
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-poke-navy/60">XP</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-poke-navy/15 md:h-4">
        <div
          className="h-full rounded-full bg-poke-blue transition-all duration-500"
          style={{ width: `${Math.min(100, (xp / needed) * 100)}%` }}
        />
      </div>
      <span className="text-xs font-bold text-poke-navy/60">
        {xp}/{needed}
      </span>
    </div>
  )
}

function ChoiceButton({
  value,
  answer,
  feedback,
  onClick
}: {
  value: number
  answer: number
  feedback: Feedback | null
  onClick: () => void
}) {
  let look =
    'bg-white border-poke-navy text-poke-navy shadow-[0_5px_0_#1b3c74] hover:bg-poke-yellow/40 active:translate-y-[3px] active:shadow-[0_2px_0_#1b3c74]'
  if (feedback) {
    if (value === answer) {
      look = 'bg-green-500 border-green-800 text-white shadow-[0_5px_0_#166534] scale-105'
    } else if (value === feedback.chosen) {
      look = 'bg-poke-red border-red-900 text-white shadow-[0_5px_0_#7f1d1d]'
    } else {
      look = 'bg-white border-poke-navy/30 text-poke-navy/40'
    }
  }
  return (
    <button
      type="button"
      disabled={feedback !== null}
      onClick={onClick}
      className={`min-h-[4.5rem] touch-manipulation select-none rounded-2xl border-2 px-4 py-3 text-4xl font-bold transition-all disabled:pointer-events-none md:min-h-24 md:text-5xl lg:min-h-[max(4.5rem,12vh)] ${look}`}
    >
      {value}
    </button>
  )
}

function EvolutionOverlay({ evolution, onDone }: { evolution: Evolution; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-poke-navy/95 p-6 text-center text-white">
      <p className="text-2xl font-bold md:text-3xl">
        {revealed ? (
          <>
            {evolution.from.name} is geëvolueerd tot{' '}
            <span className="text-poke-yellow">{evolution.to.name}</span>!
          </>
        ) : (
          <>Wat? {evolution.from.name} evolueert!</>
        )}
      </p>
      <div className="mt-6 flex aspect-square w-[min(60vw,45vh)] items-center justify-center md:mt-8">
        {revealed ? (
          <PokemonImage
            src={evolution.to.artwork}
            alt={evolution.to.name}
            fluid
            className="anim-evolve-reveal"
          />
        ) : (
          <PokemonImage
            src={evolution.from.artwork}
            alt={evolution.from.name}
            fluid
            className="anim-evolve-glow"
          />
        )}
      </div>
      {revealed && (
        <Button size="xl" className="mt-8 anim-pop md:mt-10" onClick={onDone}>
          Geweldig! ›
        </Button>
      )}
    </div>
  )
}
