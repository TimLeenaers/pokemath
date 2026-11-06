import type { GameSettings, Operation, Question, TableRange } from './types'

export const OPERATION_LABELS: Record<Operation, string> = {
  add: 'Optellen',
  sub: 'Aftrekken',
  mul: 'Vermenigvuldigen',
  div: 'Delen'
}

export const OPERATION_SYMBOLS: Record<Operation, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: ':'
}

export const OPERATION_ORDER: Operation[] = ['add', 'sub', 'mul', 'div']

export const MAX_OPTIONS = [10, 20, 50, 100, 1000]
export const TABLE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const TABLE_RANGE_OPTIONS: TableRange[] = ['tables', 'free']
export const TABLE_RANGE_LABELS: Record<'mul' | 'div', Record<TableRange, string>> = {
  mul: { tables: 'Tot 100', free: 'Vrij tot 1000 (17 × 21)' },
  div: { tables: 'Tot 100', free: 'Vrij tot 1000 (357 : 17)' }
}

export const DEFAULT_SETTINGS: GameSettings = {
  operations: ['add'],
  addMax: 20,
  subMax: 20,
  mulTables: [2, 5, 10],
  divTables: [2, 5, 10],
  mulRange: 'tables',
  divRange: 'tables'
}

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(items: readonly T[]): T {
  return items[rand(0, items.length - 1)]
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rand(0, i)
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

/** Operations that are enabled AND have enough configuration to produce a question. */
export function usableOperations(settings: GameSettings): Operation[] {
  return settings.operations.filter((op) => {
    if (op === 'mul') return settings.mulRange === 'free' || settings.mulTables.length > 0
    if (op === 'div') return settings.divRange === 'free' || settings.divTables.length > 0
    return true
  })
}

export function generateQuestion(settings: GameSettings): Question {
  const ops = usableOperations(settings)
  const op: Operation = ops.length ? pick(ops) : 'add'

  switch (op) {
    case 'add': {
      const max = Math.max(2, settings.addMax)
      const sum = rand(2, max)
      const a = rand(1, sum - 1)
      return build(op, a, sum - a, sum)
    }
    case 'sub': {
      const max = Math.max(2, settings.subMax)
      const a = rand(2, max)
      const b = rand(1, a)
      return build(op, a, b, a - b)
    }
    case 'mul': {
      if (settings.mulRange === 'free') {
        const [x, y] = freeFactors()
        const [a, b] = Math.random() < 0.5 ? [x, y] : [y, x]
        const answer = a * b
        const candidates = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b]
        candidates.push(answer + 10, answer - 10, answer + 100, answer - 100)
        return build(op, a, b, answer, candidates)
      }
      const table = pick(settings.mulTables)
      const n = rand(1, 10)
      const [a, b] = Math.random() < 0.5 ? [table, n] : [n, table]
      const answer = a * b
      const candidates = [
        a * (b + 1),
        a * (b - 1),
        (a + 1) * b,
        (a - 1) * b,
        answer + a,
        answer - a
      ]
      return build(op, a, b, answer, candidates)
    }
    case 'div': {
      if (settings.divRange === 'free') {
        const [x, y] = freeFactors()
        const [divisor, answer] = Math.random() < 0.5 ? [x, y] : [y, x]
        const candidates = [
          answer + 1,
          answer - 1,
          answer + 2,
          answer - 2,
          answer + 10,
          answer - 10
        ]
        return build(op, divisor * answer, divisor, answer, candidates)
      }
      const table = pick(settings.divTables)
      const n = rand(1, 10)
      const candidates = [n + 1, n - 1, n + 2, n - 2, table]
      return build(op, table * n, table, n, candidates)
    }
  }
}

/**
 * Two factors (both ≥ 2, at least one ≥ 11) whose product is at most 1000:
 * mostly two-digit × two-digit (17 × 21), sometimes three-digit × one-digit (124 × 7).
 */
function freeFactors(): [number, number] {
  const big = Math.random() < 0.75 ? rand(11, 99) : rand(100, 500)
  return [big, rand(2, Math.floor(1000 / big))]
}

function build(
  op: Operation,
  a: number,
  b: number,
  answer: number,
  candidates: number[] = []
): Question {
  return {
    op,
    a,
    b,
    answer,
    text: `${a} ${OPERATION_SYMBOLS[op]} ${b}`,
    choices: makeChoices(op, a, b, answer, candidates)
  }
}

/** Correct answer + 3 plausible distractors, shuffled. */
function makeChoices(
  op: Operation,
  a: number,
  b: number,
  answer: number,
  extra: number[]
): number[] {
  const candidates: number[] = [...extra]

  if (op === 'add' || op === 'sub') {
    candidates.push(answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10)
    if (op === 'sub') candidates.push(a + b)
    if (op === 'add') candidates.push(Math.abs(a - b))
  }

  const spread = answer < 20 ? 4 : answer < 100 ? 12 : Math.ceil(answer / 8)
  for (let i = 0; i < 12; i++) {
    const delta = rand(-spread, spread)
    if (delta !== 0) candidates.push(answer + delta)
  }

  const distractors = new Set<number>()
  for (const c of shuffle(candidates)) {
    if (c !== answer && c >= 0 && Number.isInteger(c)) distractors.add(c)
    if (distractors.size === 3) break
  }
  let bump = 1
  while (distractors.size < 3) {
    distractors.add(answer + bump)
    bump++
  }

  return shuffle([answer, ...distractors])
}
