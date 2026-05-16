import { v4 as uuidv4 } from 'uuid';
import { Player } from '../models/player';
import { GameMap } from '../models/map';
import { Battle } from '../models/battle';
import { Pokemon } from '../models/pokemon';
import { BattleStateData } from '../types';
import { loadPlayerSave, savePlayerData } from './user-store';

export interface GameSession {
  sessionId: string;
  createdAt: number;
  player: Player;
  map: GameMap;
  battle: Battle;
}

class SessionManager {
  private sessions: Map<string, GameSession> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  // 登录已有账户（加载存档）
  loginSession(username: string): GameSession {
    const sessionId = uuidv4();
    const save = loadPlayerSave(username);
    let player: Player;
    let map: GameMap;

    if (save) {
      player = Player.fromSaveData(save);
      map = new GameMap();
      map.currentLocation = save.currentLocation ?? 0;
    } else {
      player = new Player(username);
      map = new GameMap();
    }

    const battle = new Battle(player);
    const session: GameSession = { sessionId, createdAt: Date.now(), player, map, battle };
    this.sessions.set(sessionId, session);
    return session;
  }

  // 注册新账户 + 选初始宝可梦
  createSession(playerName: string, starterSpecies: string): GameSession {
    const sessionId = uuidv4();
    const player = new Player(playerName);
    const map = new GameMap();

    const starter = new Pokemon(starterSpecies, 5);
    player.addPokemon(starter);

    const battle = new Battle(player);
    const session: GameSession = { sessionId, createdAt: Date.now(), player, map, battle };
    this.sessions.set(sessionId, session);
    return session;
  }

  // 保存玩家存档
  savePlayer(session: GameSession): void {
    savePlayerData(session.player.name, session.player.toSaveData(session.map.currentLocation));
  }

  getSession(sessionId: string): GameSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) session.createdAt = Date.now();
    return session;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiry = 2 * 60 * 60 * 1000;
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > expiry) {
        this.sessions.delete(id);
      }
    }
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new SessionManager();
