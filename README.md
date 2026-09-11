# Pokémon Z Ladder

Web para llevar el marcador de un reto Nuzlocke de Pokémon entre varios
jugadores: puntos, medallas, historial de eventos (muertes, revivals,
curaciones ilegales...) y una ruleta que reparte consecuencias aleatorias
entre los jugadores. Estética retro estilo GBA.

## Funcionalidades

- 🏆 Ladder en tiempo real con puntuación por jugador (Supabase Realtime)
- 🎖️ Seguimiento de medallas de gimnasio
- 📜 Registro de eventos (Pokémon muerto, revivido, curación ilegal, bonus...)
- 🎡 Ruleta con efectos aleatorios entre participantes
- 🔍 Buscador de Pokémon integrado

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Supabase (Postgres + Realtime)
- Vercel (frontend + función serverless en `api/`)

## Desarrollo local

```bash
npm install
npm run dev
```

Necesitas un `.env` con las credenciales de tu proyecto de Supabase
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Estado

Proyecto personal para un reto de Pokémon con amigos, funcional pero en
evolución continua según van surgiendo nuevas reglas del reto.
