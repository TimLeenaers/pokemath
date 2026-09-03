/** Only Pokémon from the first generation are used. */
export const GEN1_MAX = 151

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export const artworkUrl = (id: number) => `${SPRITES}/other/official-artwork/${id}.png`
export const spriteUrl = (id: number) => `${SPRITES}/${id}.png`
export const spriteBackUrl = (id: number) => `${SPRITES}/back/${id}.png`

export const STARTERS: { id: number; name: string }[] = [
  { id: 1, name: 'Bulbasaur' },
  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },
  { id: 25, name: 'Pikachu' },
  { id: 133, name: 'Eevee' },
  { id: 39, name: 'Jigglypuff' },
  { id: 54, name: 'Psyduck' },
  { id: 52, name: 'Meowth' }
]

/** Correct answers needed before a Pokémon of this stage evolves. */
export function xpToEvolve(stage: number): number {
  return stage <= 1 ? 10 : 20
}

/** Hits needed to defeat an opponent of this stage. */
export function opponentMaxHp(stage: number): number {
  return 2 + stage
}

export const PLAYER_HEARTS = 3

export function randomOpponentId(exclude?: number): number {
  let id = exclude ?? 0
  while (id === (exclude ?? 0)) id = Math.floor(Math.random() * GEN1_MAX) + 1
  return id
}

export const TYPE_NAMES_NL: Record<string, string> = {
  normal: 'Normaal',
  fire: 'Vuur',
  water: 'Water',
  grass: 'Gras',
  electric: 'Elektrisch',
  ice: 'IJs',
  fighting: 'Vecht',
  poison: 'Gif',
  ground: 'Grond',
  flying: 'Vliegend',
  psychic: 'Psychisch',
  bug: 'Insect',
  rock: 'Steen',
  ghost: 'Spook',
  dragon: 'Draak',
  steel: 'Staal',
  fairy: 'Fee',
  dark: 'Duister'
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  grass: '#7AC74C',
  electric: '#F7D02C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  steel: '#B7B7CE',
  fairy: '#D685AD',
  dark: '#705746'
}

export function typeName(type: string): string {
  return TYPE_NAMES_NL[type] ?? type
}
