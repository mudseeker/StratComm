import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type StructureType = 'mine' | 'lab' | 'shipyard';
type Planet = {
  id: string;
  name: string;
  x: number;
  y: number;
  ownerId: string | null;
  productivity: number;
  buildSlots: number;
  structures: StructureType[];
  shipsDocked: number;
  economySlider: number;
};

type GameState = {
  id: string;
  turn: number;
  status: 'lobby' | 'active' | 'finished';
  players: Array<{ id: string; name: string; gold: number; researchPoints: number }>;
  planets: Planet[];
};

type OutboundMessage =
  | { type: 'createGame'; playerName: string; maxPlayers: number }
  | { type: 'joinGame'; playerName: string; gameId: string }
  | { type: 'startGame'; gameId: string; playerId: string }
  | {
      type: 'submitOrders';
      gameId: string;
      order: {
        playerId: string;
        sliderByPlanet: Record<string, number>;
        buildOrders: Array<{ planetId: string; structure: StructureType }>;
        researchSpend: number;
        moves: Array<{ fromPlanetId: string; toPlanetId: string; shipCount: number }>;
      };
    };

const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${proto}://${window.location.host}/ws`;

function App() {
  const [playerName, setPlayerName] = useState('Commander');
  const [gameIdInput, setGameIdInput] = useState('');
  const [game, setGame] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [slider, setSlider] = useState(50);
  const [researchSpend, setResearchSpend] = useState(0);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      for (const payload of queueRef.current) {
        ws.send(payload);
      }
      queueRef.current = [];
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'gameState') {
        setGame(msg.game);
        if (msg.playerId) setPlayerId(msg.playerId);
      }
    };

    return () => ws.close();
  }, []);

  const me = useMemo(() => game?.players.find((p) => p.id === playerId), [game, playerId]);
  const myPlanets = game?.planets.filter((p) => p.ownerId === playerId) ?? [];

  const sendMessage = (message: OutboundMessage) => {
    const payload = JSON.stringify(message);
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      queueRef.current.push(payload);
      return;
    }
    ws.send(payload);
  };

  const createGame = () => sendMessage({ type: 'createGame', playerName, maxPlayers });
  const joinGame = () => sendMessage({ type: 'joinGame', playerName, gameId: gameIdInput });
  const startGame = () => game && sendMessage({ type: 'startGame', gameId: game.id, playerId });

  const submitOrders = () => {
    if (!game) return;
    const sliderByPlanet: Record<string, number> = {};
    for (const p of myPlanets) sliderByPlanet[p.id] = slider / 100;
    sendMessage({
      type: 'submitOrders',
      gameId: game.id,
      order: {
        playerId,
        sliderByPlanet,
        buildOrders: myPlanets[0] ? [{ planetId: myPlanets[0].id, structure: 'mine' }] : [],
        researchSpend,
        moves: []
      }
    });
  };

  return (
    <main>
      <h1>StratComm MVP</h1>
      <p>Socket: {connected ? 'Connected' : 'Connecting...'}</p>

      {!game && (
        <section className="panel">
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" />
          <label>Max players: {maxPlayers}</label>
          <input type="range" min={2} max={6} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} />
          <button onClick={createGame} disabled={!connected}>Create Lobby</button>
          <input value={gameIdInput} onChange={(e) => setGameIdInput(e.target.value)} placeholder="Game ID" />
          <button onClick={joinGame} disabled={!connected}>Join Lobby</button>
        </section>
      )}

      {game && (
        <>
          <section className="panel">
            <p>Game: <strong>{game.id}</strong> | Turn {game.turn} | Status: {game.status}</p>
            <p>You: {me?.name} | Gold: {me?.gold} | Research: {me?.researchPoints}</p>
            {game.status === 'lobby' && <button onClick={startGame} disabled={!connected}>Start Match</button>}
          </section>

          <section className="panel">
            <h3>Orders</h3>
            <label>Economy vs ship production ({slider}% economy)</label>
            <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} />
            <label>Research Spend</label>
            <input type="number" value={researchSpend} onChange={(e) => setResearchSpend(Number(e.target.value))} />
            <button onClick={submitOrders} disabled={!connected}>Submit Turn Orders</button>
          </section>

          <section className="map">
            {game.planets.map((planet) => (
              <div key={planet.id} className={`planet ${planet.ownerId === playerId ? 'owned' : ''}`} style={{ left: `${planet.x}%`, top: `${planet.y}%` }}>
                <strong>{planet.name}</strong>
                <span>{planet.shipsDocked} ships</span>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
