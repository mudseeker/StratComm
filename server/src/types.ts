export type StructureType = 'mine' | 'lab' | 'shipyard';

export interface Planet {
  id: string;
  name: string;
  x: number;
  y: number;
  ownerId: string | null;
  productivity: number;
  buildSlots: number;
  structures: StructureType[];
  shipsDocked: number;
  economySlider: number; // 0..1
}

export interface PlayerState {
  id: string;
  name: string;
  gold: number;
  researchPoints: number;
}

export interface ShipMoveOrder {
  fromPlanetId: string;
  toPlanetId: string;
  shipCount: number;
}

export interface PlayerOrder {
  playerId: string;
  sliderByPlanet: Record<string, number>;
  buildOrders: Array<{ planetId: string; structure: StructureType }>;
  researchSpend: number;
  moves: ShipMoveOrder[];
}

export interface GameState {
  id: string;
  turn: number;
  maxPlayers: number;
  status: 'lobby' | 'active' | 'finished';
  players: PlayerState[];
  planets: Planet[];
  orders: Record<string, PlayerOrder>;
}
