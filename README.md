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

- API/WebSocket server: `http://localhost:3000` (`/api/*` and `/ws`)
- Vite client: `http://localhost:5173`

## GitHub Codespaces
1. Start the app:
   ```bash
   npm install
   npm run dev
   ```
2. Forward port `5173` publicly (or in-browser) and open the client URL.
3. Keep port `3000` private/internal; Vite proxies client traffic:
   - `/api` → `http://localhost:3000`
   - `/ws` → `ws://localhost:3000`
4. In browser DevTools, verify WebSocket upgrade:
   - Network tab → WS
   - Request to `/ws`
   - Status should be `101 Switching Protocols`

## Test
```bash
npm test
```
