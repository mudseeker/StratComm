import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { customAlphabet } from 'nanoid';
import { allOrdersSubmitted, assignStartingPlanets, createGame, defaultOrder, resolveTurn } from './game.js';
import { loadGame, saveGame } from './db.js';
import { GameState, PlayerOrder, PlayerState } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => console.log(`Server on ${port}`));
const wss = new WebSocketServer({ server });
const playerIdGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const games = new Map<string, GameState>();
const socketsByGame = new Map<string, Set<WebSocket>>();

app.get('/health', (_req, res) => res.json({ ok: true }));

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      handleMessage(ws, msg);
    } catch {
      send(ws, { type: 'error', message: 'Invalid message' });
    }
  });
});

type ClientMsg =
  | { type: 'createGame'; playerName: string; maxPlayers: number }
  | { type: 'joinGame'; playerName: string; gameId: string }
  | { type: 'startGame'; gameId: string; playerId: string }
  | { type: 'submitOrders'; gameId: string; order: PlayerOrder };

function handleMessage(ws: WebSocket, msg: ClientMsg): void {
  if (msg.type === 'createGame') {
    const game = createGame(Math.max(2, Math.min(6, msg.maxPlayers)));
    const player = createPlayer(msg.playerName);
    game.players.push(player);
    games.set(game.id, game);
    saveGame(game);
    registerSocket(game.id, ws);
    send(ws, { type: 'gameState', game, playerId: player.id });
    return;
  }

  if (msg.type === 'joinGame') {
    const game = games.get(msg.gameId) ?? loadGame(msg.gameId);
    if (!game) return send(ws, { type: 'error', message: 'Game not found' });
    if (game.players.length >= game.maxPlayers) return send(ws, { type: 'error', message: 'Lobby full' });
    const player = createPlayer(msg.playerName);
    game.players.push(player);
    games.set(game.id, game);
    saveGame(game);
    registerSocket(game.id, ws);
    broadcast(game.id, { type: 'gameState', game, playerId: player.id });
    return;
  }

  if (msg.type === 'startGame') {
    const game = games.get(msg.gameId);
    if (!game) return;
    if (!game.players.some((p) => p.id === msg.playerId)) return;
    game.status = 'active';
    assignStartingPlanets(game);
    saveGame(game);
    broadcast(game.id, { type: 'gameState', game });
    return;
  }

  if (msg.type === 'submitOrders') {
    const game = games.get(msg.gameId);
    if (!game || game.status !== 'active') return;
    const order = { ...defaultOrder(msg.order.playerId), ...msg.order };
    game.orders[order.playerId] = order;
    if (allOrdersSubmitted(game)) {
      const resolved = resolveTurn(game);
      games.set(game.id, resolved);
      saveGame(resolved);
      broadcast(game.id, { type: 'gameState', game: resolved });
    } else {
      broadcast(game.id, { type: 'ordersUpdate', received: Object.keys(game.orders).length, total: game.players.length });
    }
  }
}

function createPlayer(name: string): PlayerState {
  return {
    id: playerIdGen(),
    name,
    gold: 800,
    researchPoints: 0
  };
}

function registerSocket(gameId: string, ws: WebSocket): void {
  const set = socketsByGame.get(gameId) ?? new Set<WebSocket>();
  set.add(ws);
  socketsByGame.set(gameId, set);
  ws.on('close', () => set.delete(ws));
}

function send(ws: WebSocket, payload: unknown): void {
  ws.send(JSON.stringify(payload));
}

function broadcast(gameId: string, payload: unknown): void {
  const set = socketsByGame.get(gameId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}
