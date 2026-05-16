import { Pokemon } from './pokemon';
import { Item, PokemonData } from '../types';
import {
  MAX_TEAM_SIZE, STARTER_POKEBALL, STARTER_GREATBALL, STARTER_ULTRABALL,
  STARTER_MASTERBALL, HEAL_POTION_PERCENT, EXP_POTION_AMOUNT, REVIVE_HP_AMOUNT,
  EXP_LEVEL_BASE,
} from '../config';
import { createStarterItems } from '../data/items';
import { PlayerSaveData } from '../services/user-store';

export class Player {
  name: string;
  team: Pokemon[];
  storage: Pokemon[];
  pokeballs: [number, number, number, number];
  items: Item[];
  gold: number;

  constructor(name: string) {
    this.name = name;
    this.team = [];
    this.storage = [];
    this.pokeballs = [STARTER_POKEBALL, STARTER_GREATBALL, STARTER_ULTRABALL, STARTER_MASTERBALL];
    this.items = createStarterItems();
    this.gold = 0;
  }

  // 从存档恢复
  static fromSaveData(save: PlayerSaveData): Player {
    const p = new Player(save.username);
    p.name = save.username;
    p.pokeballs = save.pokeballs as [number, number, number, number];
    p.items = save.items.map((it: any) => ({ ...it }));
    p.gold = save.gold ?? 0;
    for (const pd of save.team) {
      p.team.push(Pokemon.fromData(pd));
    }
    for (const pd of save.storage) {
      p.storage.push(Pokemon.fromData(pd));
    }
    return p;
  }

  // 导出存档数据
  toSaveData(currentLocation: number): PlayerSaveData {
    return {
      username: this.name,
      team: this.getTeamData(),
      storage: this.getStorageData(),
      pokeballs: [...this.pokeballs],
      items: this.items.map(it => ({ ...it })),
      gold: this.gold,
      currentLocation,
    };
  }

  addPokemon(p: Pokemon): void {
    if (this.team.length < MAX_TEAM_SIZE) {
      this.team.push(p);
    } else {
      this.storage.push(p);
    }
  }

  getCurrentPokemon(): Pokemon | null {
    for (const p of this.team) {
      if (!p.isFainted()) return p;
    }
    return null;
  }

  hasAlivePokemon(): boolean {
    return this.team.some(p => !p.isFainted());
  }

  getTotalBalls(): number {
    return this.pokeballs[0] + this.pokeballs[1] + this.pokeballs[2] + this.pokeballs[3];
  }

  getHealPotionCount(): number {
    for (const item of this.items) {
      if (!item.isRevive && item.healPercent > 0) return item.count;
    }
    return 0;
  }

  swapTeamPokemon(index1: number, index2: number): boolean {
    if (index1 < 0 || index1 >= this.team.length || index2 < 0 || index2 >= this.team.length) {
      return false;
    }
    [this.team[index1], this.team[index2]] = [this.team[index2], this.team[index1]];
    return true;
  }

  movePokemonToStorage(teamIndex: number): boolean {
    if (teamIndex < 0 || teamIndex >= this.team.length) return false;
    if (this.team.length <= 1) return false;
    this.storage.push(this.team[teamIndex]);
    this.team.splice(teamIndex, 1);
    return true;
  }

  movePokemonFromStorage(storageIndex: number): boolean {
    if (storageIndex < 0 || storageIndex >= this.storage.length) return false;
    if (this.team.length >= MAX_TEAM_SIZE) return false;
    this.team.push(this.storage[storageIndex]);
    this.storage.splice(storageIndex, 1);
    return true;
  }

  useItemOnPokemon(itemIndex: number, pokemonIndex: number, isTeam: boolean): boolean {
    if (itemIndex < 0 || itemIndex >= this.items.length) return false;
    const item = this.items[itemIndex];
    if (item.count <= 0) return false;
    if (item.isRevive) return false;

    const target = isTeam
      ? (pokemonIndex >= 0 && pokemonIndex < this.team.length ? this.team[pokemonIndex] : null)
      : (pokemonIndex >= 0 && pokemonIndex < this.storage.length ? this.storage[pokemonIndex] : null);

    if (!target) return false;
    if (target.isFainted()) return false;

    if (item.healPercent > 0) {
      const healAmount = Math.floor(target.stats.maxHp * item.healPercent / 100);
      target.stats.hp = Math.min(target.stats.hp + healAmount, target.stats.maxHp);
    }

    if (item.expAmount > 0) {
      target.exp += item.expAmount;
      while (target.exp >= target.maxExp) {
        target.exp -= target.maxExp;
        target.level++;
        target.maxExp += EXP_LEVEL_BASE;
        target.stats.maxHp += 3;
        target.stats.hp += 3;
        target.stats.attack += 1;
        target.stats.defense += 1;
        target.stats.speed += 1;
      }
    }

    item.count--;
    return true;
  }

  revivePokemon(itemIndex: number, pokemonIndex: number): boolean {
    if (itemIndex < 0 || itemIndex >= this.items.length) return false;
    const item = this.items[itemIndex];
    if (item.count <= 0) return false;
    if (!item.isRevive) return false;
    if (pokemonIndex < 0 || pokemonIndex >= this.team.length) return false;

    const target = this.team[pokemonIndex];
    if (!target.isFainted()) return false;

    target.stats.hp = REVIVE_HP_AMOUNT;
    item.count--;
    return true;
  }

  getTeamData(): PokemonData[] {
    return this.team.map(p => p.toData());
  }

  getStorageData(): PokemonData[] {
    return this.storage.map(p => p.toData());
  }
}
