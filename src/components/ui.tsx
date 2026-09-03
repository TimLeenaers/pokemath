'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { TYPE_COLORS, typeName } from '@/lib/pokemon'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'md' | 'lg' | 'xl'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-poke-yellow text-poke-navy border-poke-navy shadow-[0_5px_0_#1b3c74] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_2px_0_#1b3c74]',
  secondary:
    'bg-white text-poke-navy border-poke-navy shadow-[0_5px_0_#1b3c74] hover:bg-blue-50 active:translate-y-[3px] active:shadow-[0_2px_0_#1b3c74]',
  danger:
    'bg-poke-red text-white border-red-900 shadow-[0_5px_0_#7f1d1d] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_2px_0_#7f1d1d]',
  ghost: 'bg-transparent text-poke-navy border-transparent hover:bg-white/60'
}

// Minimum 44px tall so every button is a comfortable touch target on a tablet.
const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 py-2 text-base rounded-xl',
  lg: 'min-h-14 px-6 py-3 text-xl rounded-2xl',
  xl: 'min-h-16 px-8 py-4 text-2xl rounded-2xl'
}

function buttonClass(variant: Variant, size: Size, extra?: string) {
  return `inline-flex items-center justify-center gap-2 font-bold border-2 transition-all select-none touch-manipulation disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${extra ?? ''}`
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl border-2 border-poke-navy/80 bg-white/90 shadow-[0_6px_0_rgba(27,60,116,0.35)] backdrop-blur ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
      style={{ backgroundColor: TYPE_COLORS[type] ?? '#777' }}
    >
      {typeName(type)}
    </span>
  )
}

/**
 * Pokémon picture. Pass `size` for a fixed pixel size, or `fluid` to fill the parent
 * (the parent then decides the size, e.g. with a responsive `w-[...]` + `aspect-square`).
 */
export function PokemonImage({
  src,
  alt,
  size = 96,
  fluid = false,
  pixelated = false,
  className
}: {
  src: string
  alt: string
  size?: number
  fluid?: boolean
  pixelated?: boolean
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={fluid ? 'h-full w-full' : ''}
        style={fluid ? undefined : { width: size, height: size }}
        aria-hidden
      />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      width={fluid ? undefined : size}
      height={fluid ? undefined : size}
      draggable={false}
      className={`${pixelated ? 'pixelated' : ''} select-none ${fluid ? 'h-full w-full' : ''} ${className ?? ''}`}
      style={fluid ? { objectFit: 'contain' } : { width: size, height: size, objectFit: 'contain' }}
    />
  )
}

export function Pokeball({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#1b3c74" strokeWidth="6" />
      <path d="M4 50a46 46 0 0 1 92 0Z" fill="#ee1515" />
      <path d="M4 50h92" stroke="#1b3c74" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke="#1b3c74" strokeWidth="6" />
      <circle cx="50" cy="50" r="6" fill="#1b3c74" />
    </svg>
  )
}

export function Loading({ text = 'Even geduld…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-poke-navy/70">
      <Pokeball size={56} className="anim-wobble" />
      <p className="text-lg font-semibold">{text}</p>
    </div>
  )
}

/** Page container. `wide` gives the battle screen room on a landscape tablet. */
export function Page({
  children,
  className,
  wide = false
}: {
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col px-4 py-4 sm:px-6 md:py-6 ${
        wide ? 'max-w-6xl' : 'max-w-3xl'
      } ${className ?? ''}`}
    >
      {children}
    </main>
  )
}
