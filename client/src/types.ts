// 与后端 types.ts 对应的前端类型

export enum Type {
  Normal, Fire, Water, Grass, Electric, Ice, Fighting, Ground, Flying,
}

export interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface Move {
  name: string;
  type: Type;
  power: number;
  accuracy: number;
  isSpecial: boolean;
}

export interface PokemonData {
  name: string;
  species: string;
  type: Type;
  level: number;
  stats: Stats;
  exp: number;
  maxExp: number;
  moves: Move[];
}

export interface ItemData {
  name: string;
  count: number;
  healPercent: number;
  expAmount: number;
  isRevive: boolean;
}

export interface MapLocation {
  index: number;
  name: string;
  x: number;
  y: number;
  connections: { direction: string; toIndex: number }[];
  wildPokemons: string[];
}

// API 响应类型
export interface GameStartResponse {
  sessionId: string;
  playerName: string;
  currentLocation: string;
  locationDescription: string;
  totalPokeBalls: number;
  teamCount: number;
  maxTeamSize: number;
  team: PokemonData[];
}

export interface PlayerStatusResponse {
  playerName: string;
  currentLocation: string;
  locationDescription: string;
  totalPokeBalls: number;
  teamCount: number;
  maxTeamSize: number;
  gold?: number;
}

export interface MoveResponse {
  success: boolean;
  message: string;
  encounterWildPokemon: boolean;
  wildPokemonSpecies: string | null;
  newLocation?: string;
  newLocationDescription?: string;
}

export interface BattleStateResponse {
  inBattle: boolean;
  playerPokeIndex: number;
  playerPokeName: string;
  playerPokeHp: number;
  playerPokeMaxHp: number;
  playerPokeLevel: number;
  playerPokeMoves: Move[];
  enemyPokeName: string;
  enemyPokeHp: number;
  enemyPokeMaxHp: number;
  enemyPokeLevel: number;
  playerTurn: boolean;
  actionLog: string[];
  playerTeam: PokemonData[];
  healCount: number;
  ballCount: number;
  ballCounts: number[];
}

export interface BattleActionResponse {
  battleEnded: boolean;
  actionLog: string;
  playerPokeHp: number;
  enemyPokeHp: number;
  playerPokeName?: string;
  enemyPokeName?: string;
}

export interface TeamResponse {
  team: PokemonData[];
  storage: PokemonData[];
}

export interface ItemsResponse {
  items: ItemData[];
}

export interface MapCurrentResponse {
  currentLocationIndex: number;
  locationName: string;
  locationDescription: string;
  availableDirections: string[];
  wildPokemons: string[];
  allLocations: MapLocation[];
}

export type Screen = 'start' | 'game' | 'battle' | 'team';

export interface GameState {
  sessionId: string | null;
  screen: Screen;
  playerName: string;
  playerStatus: PlayerStatusResponse | null;
  map: MapCurrentResponse | null;
  battle: BattleStateResponse | null;
  team: PokemonData[];
  storage: PokemonData[];
  items: ItemData[];
  loading: boolean;
  error: string | null;
  notification: string | null;
}

export type GameAction =
  | { type: 'SET_SESSION'; sessionId: string }
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'UPDATE_PLAYER'; status: PlayerStatusResponse }
  | { type: 'UPDATE_MAP'; map: MapCurrentResponse }
  | { type: 'ENTER_BATTLE'; battle: BattleStateResponse }
  | { type: 'UPDATE_BATTLE'; battle: BattleActionResponse & { playerTurn: boolean } }
  | { type: 'EXIT_BATTLE' }
  | { type: 'UPDATE_TEAM'; team: PokemonData[]; storage: PokemonData[] }
  | { type: 'UPDATE_ITEMS'; items: ItemData[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_NOTIFICATION'; notification: string | null }
  | { type: 'RESET' };
