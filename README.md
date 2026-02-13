# StratComm MVP

Turn-based multiplayer strategy game prototype with Node+TypeScript server, React+TypeScript client, WebSockets, and SQLite persistence.

## Features
- Lobby with create/join game (2-6 players).
- 12-18 planets on a 2D map.
- Planet model: name, owner, productivity, buildSlots, structures, shipsDocked.
- Player resources: gold and research points (starts at 800 gold).
- Simultaneous turn resolution for build/research/move orders.
- Economy vs ship production slider per planet.
- SQLite storage for game snapshots.
- Turn resolution tests.

## Dev setup
```bash
npm install
npm run dev
```

- Server: http://localhost:3000
- Client: http://localhost:5173

## Test
```bash
npm test
```
