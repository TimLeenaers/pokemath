# Poké Math

Een rekenspel voor kinderen: los sommen op om je Pokémon te laten winnen, vang nieuwe Pokémon en
laat ze evolueren. Optellen, aftrekken, vermenigvuldigen en delen — apart of gemixt.

## Hoe werkt het

1. **Speler kiezen** — op het startscherm kies je je naam, of maak je een nieuwe speler aan.
   Meerdere kinderen kunnen op hetzelfde toestel spelen; alles wordt lokaal bewaard (`localStorage`),
   er is geen database of account.
2. **Starter kiezen** — Bulbasaur, Charmander, Squirtle, Pikachu, Eevee, Jigglypuff, Psyduck of Meowth.
3. **Moeilijkheid** — per bewerking:
   - Optellen: som tot 10 / 20 / 50 / 100 / 1000
   - Aftrekken: getallen tot 10 / 20 / 50 / 100 / 1000
   - Vermenigvuldigen: één of meer tafels (1–10)
   - Delen: delen door één of meer tafels (1–10)
   Meerdere bewerkingen aanvinken = gemixte vragen.
4. **Vechten** — een willekeurige Pokémon uit de eerste generatie (151) daagt je uit met een som.
   Kies uit 4 antwoorden. Juist = jouw Pokémon valt aan (dubbel bij een type-zwakte!),
   fout = je verliest een hartje. Versla de tegenstander en je vangt hem.
5. **Evolueren** — elk juist antwoord geeft XP aan je actieve Pokémon. Na 10 juiste antwoorden
   (20 voor de tweede stap) evolueert hij, met evolutieketens uit PokéAPI.

## Techniek

- [Next.js](https://nextjs.org) (App Router) + React + Tailwind v4, TypeScript.
- Pokémon-gegevens, sprites, types/zwaktes en evoluties komen van de open [PokéAPI](https://pokeapi.co)
  via de eigen route `src/app/api/pokemon/[id]/route.ts` (een dag gecached, ook op Vercel).
- Spelstate: `src/lib/storage.ts` (profielen in `localStorage`, meerdere spelers per toestel).
- Vragen: `src/lib/math.ts` (generator + plausibele foute antwoorden).

## Ontwikkelen

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Deploy op Vercel

Importeer de repository in Vercel; er zijn geen environment variables nodig.
Framework preset "Next.js", build command `next build`.
