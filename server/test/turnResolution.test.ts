import { describe, expect, it } from 'vitest';
import { resolveTurn } from '../src/game.js';
import { GameState } from '../src/types.js';

function baseGame(): GameState {
  return {
    id: 'g1',
    turn: 1,
    maxPlayers: 2,
    status: 'active',
    players: [
      { id: 'p1', name: 'A', gold: 800, researchPoints: 0 },
      { id: 'p2', name: 'B', gold: 800, researchPoints: 0 }
    ],
    planets: [
      { id: 'a', name: 'A', x: 0, y: 0, ownerId: 'p1', productivity: 100, buildSlots: 2, structures: [], shipsDocked: 20, economySlider: 0.5 },
      { id: 'b', name: 'B', x: 1, y: 1, ownerId: 'p2', productivity: 100, buildSlots: 2, structures: [], shipsDocked: 20, economySlider: 0.5 }
    ],
    orders: {}
  };
}

describe('resolveTurn', () => {
  it('applies economy slider and ship production', () => {
    const game = baseGame();
    game.orders.p1 = {
      playerId: 'p1',
      sliderByPlanet: { a: 0.8 },
      buildOrders: [],
      researchSpend: 0,
      moves: []
    };
    game.orders.p2 = {
      playerId: 'p2', sliderByPlanet: {}, buildOrders: [], researchSpend: 0, moves: []
    };

    const next = resolveTurn(game);
    expect(next.players[0].gold).toBe(880);
    expect(next.planets[0].shipsDocked).toBe(22);
  });

  it('resolves combat and captures planets', () => {
    const game = baseGame();
    game.planets[1].shipsDocked = 5;
    game.orders.p1 = {
      playerId: 'p1', sliderByPlanet: {}, buildOrders: [], researchSpend: 0,
      moves: [{ fromPlanetId: 'a', toPlanetId: 'b', shipCount: 10 }]
    };
    game.orders.p2 = { playerId: 'p2', sliderByPlanet: {}, buildOrders: [], researchSpend: 0, moves: [] };

    const next = resolveTurn(game);
    expect(next.planets[1].ownerId).toBe('p1');
    expect(next.planets[1].shipsDocked).toBeGreaterThan(0);
  });
});
