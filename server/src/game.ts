import { customAlphabet } from 'nanoid';
import { GameState, Planet, PlayerOrder, StructureType } from './types.js';

const id = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const planetNames = [
  'Aster', 'Brakka', 'Cygnus', 'Dione', 'Erebus', 'Falkor', 'Gaia', 'Helios',
  'Ionia', 'Juno', 'Kronos', 'Lumen', 'Myria', 'Nyx', 'Orion', 'Prax', 'Quasar', 'Rhea'
];

const structureCosts: Record<StructureType, number> = {
  mine: 120,
  lab: 140,
  shipyard: 180
};

export function createGame(maxPlayers: number): GameState {
  return {
    id: id(),
    turn: 1,
    maxPlayers,
    status: 'lobby',
    players: [],
    planets: generatePlanets(),
    orders: {}
  };
}

function generatePlanets(): Planet[] {
  const count = 12 + Math.floor(Math.random() * 7);
  return Array.from({ length: count }).map((_, index) => ({
    id: `planet-${index + 1}`,
    name: planetNames[index],
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
    ownerId: null,
    productivity: 80 + Math.floor(Math.random() * 50),
    buildSlots: 2 + Math.floor(Math.random() * 3),
    structures: [],
    shipsDocked: 5,
    economySlider: 0.5
  }));
}

export function assignStartingPlanets(game: GameState): void {
  game.players.forEach((player, i) => {
    const p = game.planets[i];
    if (!p) return;
    p.ownerId = player.id;
    p.shipsDocked = 20;
  });
}

export function resolveTurn(game: GameState): GameState {
  const next: GameState = structuredClone(game);

  for (const order of Object.values(next.orders)) {
    const player = next.players.find((p) => p.id === order.playerId);
    if (!player) continue;

    for (const [planetId, slider] of Object.entries(order.sliderByPlanet)) {
      const planet = next.planets.find((p) => p.id === planetId && p.ownerId === player.id);
      if (planet) planet.economySlider = clamp(slider, 0, 1);
    }

    const spendableResearch = Math.min(order.researchSpend, player.gold);
    player.gold -= spendableResearch;
    player.researchPoints += spendableResearch;

    for (const build of order.buildOrders) {
      const planet = next.planets.find((p) => p.id === build.planetId && p.ownerId === player.id);
      if (!planet) continue;
      if (planet.structures.length >= planet.buildSlots) continue;
      const cost = structureCosts[build.structure];
      if (player.gold < cost) continue;
      player.gold -= cost;
      planet.structures.push(build.structure);
    }
  }

  for (const planet of next.planets) {
    if (!planet.ownerId) continue;
    const owner = next.players.find((p) => p.id === planet.ownerId);
    if (!owner) continue;
    const econ = Math.floor(planet.productivity * planet.economySlider);
    const ships = Math.floor((planet.productivity - econ) / 10);
    owner.gold += econ;
    planet.shipsDocked += ships;
  }

  for (const order of Object.values(next.orders)) {
    for (const move of order.moves) {
      const from = next.planets.find((p) => p.id === move.fromPlanetId);
      const to = next.planets.find((p) => p.id === move.toPlanetId);
      if (!from || !to || from.ownerId !== order.playerId) continue;
      if (move.shipCount <= 0 || from.shipsDocked < move.shipCount) continue;
      from.shipsDocked -= move.shipCount;
      if (to.ownerId === order.playerId || to.ownerId === null) {
        to.ownerId = order.playerId;
        to.shipsDocked += move.shipCount;
      } else {
        to.shipsDocked -= move.shipCount;
        if (to.shipsDocked < 0) {
          to.ownerId = order.playerId;
          to.shipsDocked = Math.abs(to.shipsDocked);
        }
      }
    }
  }

  next.turn += 1;
  next.orders = {};
  return next;
}

export function allOrdersSubmitted(game: GameState): boolean {
  if (game.players.length === 0) return false;
  return game.players.every((p) => Boolean(game.orders[p.id]));
}

export function defaultOrder(playerId: string): PlayerOrder {
  return { playerId, sliderByPlanet: {}, buildOrders: [], researchSpend: 0, moves: [] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
