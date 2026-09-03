export type Operation = 'add' | 'sub' | 'mul' | 'div'

export interface GameSettings {
  /** Which operations may appear. Multiple = mixed questions. */
  operations: Operation[]
  /** Highest sum for addition questions. */
  addMax: number
  /** Highest starting number for subtraction questions. */
  subMax: number
  /** Multiplication tables (e.g. [2, 5, 10]). */
  mulTables: number[]
  /** Division tables: "delen door" (e.g. [2, 5, 10]). */
  divTables: number[]
}

export interface OwnedPokemon {
  uid: string
  pokemonId: number
  /** Correct answers earned since the last evolution. */
  xp: number
  evolutions: number
  caughtAt: number
}

export interface Profile {
  id: string
  name: string
  createdAt: number
  score: number
  correct: number
  wrong: number
  bestStreak: number
  battlesWon: number
  settings: GameSettings
  team: OwnedPokemon[]
  activeUid: string
}

export interface PokemonInfo {
  id: number
  name: string
  types: string[]
  sprite: string
  spriteBack: string
  artwork: string
  /** Attacking types that deal double damage to this Pokémon. */
  weaknesses: string[]
  /** Next evolutions (Gen 1 only). Empty when fully evolved. */
  evolvesTo: { id: number; name: string }[]
  /** 1 = basic, 2 = first evolution, 3 = second evolution. */
  stage: number
}

export interface Question {
  op: Operation
  a: number
  b: number
  text: string
  answer: number
  choices: number[]
}
