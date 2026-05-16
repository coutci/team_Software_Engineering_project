import { Player } from './player';
import { Pokemon } from './pokemon';
import { getTypeEffectiveness, getTypeName } from '../data/type-chart';
import { calculateDamage, calculateEscapeChance, calculateCatchProbability } from './battle-rules';
import { Move, PokeBallType, PokemonData, BattleStateData } from '../types';
import { HEAL_POTION_PERCENT, EXP_BASE_GAIN, EXP_LEVEL_BASE, GOLD_WIN_BATTLE, GOLD_CATCH_POKEMON } from '../config';

interface PokeBallInfo {
  type: PokeBallType;
  name: string;
  catchRate: number;
}

const BALL_INFO: PokeBallInfo[] = [
  { type: PokeBallType.PokeBall, name: '精灵球', catchRate: 1.0 },
  { type: PokeBallType.GreatBall, name: '超级球', catchRate: 1.5 },
  { type: PokeBallType.UltraBall, name: '高级球', catchRate: 2.0 },
  { type: PokeBallType.MasterBall, name: '大师球', catchRate: 5.0 },
];

export class Battle {
  private player: Player;
  inBattle: boolean;
  wildPokemon: Pokemon | null;
  playerPokeIndex: number;
  playerTurn: boolean;
  actionLog: string[];

  constructor(player: Player) {
    this.player = player;
    this.inBattle = false;
    this.wildPokemon = null;
    this.playerPokeIndex = 0;
    this.playerTurn = true;
    this.actionLog = [];
  }

  start(wildPokemonSpecies: string): void {
    this.inBattle = true;
    this.wildPokemon = new Pokemon(wildPokemonSpecies, 5);
    this.actionLog = [];

    // 找到第一只存活的宝可梦出战
    this.playerPokeIndex = 0;
    for (let i = 0; i < this.player.team.length; i++) {
      if (!this.player.team[i].isFainted()) {
        this.playerPokeIndex = i;
        break;
      }
    }

    const playerPoke = this.player.team[this.playerPokeIndex];
    this.playerTurn = playerPoke.stats.speed >= this.wildPokemon.stats.speed;

    this.actionLog.push('===============================');
    this.actionLog.push('⚔️  战斗开始！');
    this.actionLog.push('===============================');

    // 如果敌方先手，立刻执行敌方回合
    if (!this.playerTurn) {
      this.enemyTurn();
      this.checkBattleEnd();
    }
  }

  isInBattle(): boolean {
    return this.inBattle;
  }

  getState(): BattleStateData {
    return {
      inBattle: this.inBattle,
      wildPokemon: this.wildPokemon ? this.wildPokemon.toData() : null,
      playerPokeIndex: this.playerPokeIndex,
      playerTurn: this.playerTurn,
      actionLog: [...this.actionLog],
    };
  }

  getPlayerTeam(): PokemonData[] {
    return this.player.getTeamData();
  }

  playerAction(actionType: number, targetIndex?: number): {
    battleEnded: boolean;
    actionLog: string;
    playerPokeHp: number;
    enemyPokeHp: number;
    playerPokeName?: string;
    enemyPokeName?: string;
    caughtPokemon?: string;
  } {
    this.actionLog = [];

    if (!this.inBattle || !this.wildPokemon) {
      return this.buildResult();
    }

    if (!this.playerTurn) {
      this.actionLog.push('现在不是你的回合！');
      return this.buildResult();
    }

    let acted = false;

    switch (actionType) {
      case 1: // 技能
        acted = this.handleMove(targetIndex ?? 0);
        break;
      case 2: // 精灵球
        acted = this.handleCatch(targetIndex ?? 0);
        break;
      case 3: // 治疗
        acted = this.handleHeal();
        break;
      case 4: // 更换精灵
        acted = this.handleSwitch(targetIndex ?? -1);
        break;
      case 5: // 逃跑
        acted = this.handleEscape();
        break;
      default:
        this.actionLog.push('无效操作或参数错误');
        return this.buildResult();
    }

    if (!acted) {
      return this.buildResult();
    }

    this.playerTurn = false;

    // 敌方回合
    if (this.inBattle) {
      this.enemyTurn();
    }

    this.checkBattleEnd();

    return this.buildResult();
  }

  private enemyTurn(): void {
    if (!this.wildPokemon || !this.inBattle) return;

    this.actionLog.push('');
    this.actionLog.push('👉 敌方回合！');

    const playerPoke = this.player.team[this.playerPokeIndex];
    const enemyPoke = this.wildPokemon;

    if (enemyPoke.moves.length > 0) {
      const moveIndex = Math.floor(Math.random() * enemyPoke.moves.length);
      this.useMove(enemyPoke, playerPoke, moveIndex, false);
    }

    this.playerTurn = true;
  }

  private handleMove(moveIndex: number): boolean {
    const playerPoke = this.player.team[this.playerPokeIndex];
    const enemyPoke = this.wildPokemon!;

    if (moveIndex < 0 || moveIndex >= playerPoke.moves.length) {
      this.actionLog.push('技能无效！');
      return false;
    }

    this.useMove(playerPoke, enemyPoke, moveIndex, true);
    return true;
  }

  private useMove(attacker: Pokemon, defender: Pokemon, moveIndex: number, isPlayer: boolean): void {
    if (moveIndex < 0 || moveIndex >= attacker.moves.length) {
      this.actionLog.push('技能无效！');
      return;
    }

    const move = attacker.moves[moveIndex];
    this.actionLog.push(`✨ ${attacker.name} 使用了 ${move.name}！`);

    // 命中检查
    const accuracyRoll = Math.floor(Math.random() * 100) + 1;
    if (accuracyRoll > move.accuracy) {
      this.actionLog.push('💨 但是攻击落空了！');
      return;
    }

    if (move.power > 0) {
      const randomFactor = 0.85 + Math.random() * 0.15;
      const damage = calculateDamage(attacker, defender, move, randomFactor);
      const effectiveness = getTypeEffectiveness(move.type, defender.type);

      if (effectiveness === 0) {
        this.actionLog.push(`🚫 对${getTypeName(defender.type)}属性无效！`);
        return;
      }

      if (effectiveness > 1.0) {
        this.actionLog.push('🔥 效果绝佳！');
      } else if (effectiveness < 1.0) {
        this.actionLog.push('🛡️ 效果不好...');
      }

      defender.stats.hp -= damage;
      if (defender.stats.hp < 0) defender.stats.hp = 0;

      this.actionLog.push(`💥 造成了 ${damage} 点伤害！`);
    } else {
      this.actionLog.push('💫 但是这是变化技能，效果尚未实现！');
    }
  }

  private handleCatch(ballIndex: number): boolean {
    if (ballIndex < 0 || ballIndex > 3) {
      this.actionLog.push('无效的精灵球选择！');
      return false;
    }

    if (this.player.pokeballs[ballIndex] <= 0) {
      this.actionLog.push('这种精灵球已经用完了！');
      return false;
    }

    const enemyPoke = this.wildPokemon!;
    this.player.pokeballs[ballIndex]--;
    const ball = BALL_INFO[ballIndex];

    const catchProbability = calculateCatchProbability(
      enemyPoke.stats.hp,
      enemyPoke.stats.maxHp,
      enemyPoke.level,
      ball.catchRate,
      ballIndex === 3,
    );

    this.actionLog.push(`🔵 投出${ball.name}...`);

    const roll = Math.random() * 100;
    if (roll < catchProbability) {
      this.actionLog.push('💫 摇晃...摇晃...咔嚓！');
      this.actionLog.push(`🎉 成功收服了 ${enemyPoke.name}！`);
      this.player.gold += GOLD_CATCH_POKEMON;
      this.actionLog.push(`💰 获得了 ${GOLD_CATCH_POKEMON} 金币！`);

      enemyPoke.stats.hp = enemyPoke.stats.maxHp;
      this.player.addPokemon(enemyPoke);

      this.inBattle = false;
    } else {
      this.actionLog.push('💨 哎呀！宝可梦挣脱了！');
    }

    return true;
  }

  private handleHeal(): boolean {
    const playerPoke = this.player.team[this.playerPokeIndex];

    if (this.player.getHealPotionCount() <= 0) {
      this.actionLog.push('❌ 没有治疗药水了！');
      return false;
    }

    if (playerPoke.isFainted()) {
      this.actionLog.push(`❌ ${playerPoke.name} 已经失去战斗能力，无法使用治疗药水！`);
      return false;
    }

    const healAmount = Math.max(1, Math.floor(playerPoke.stats.maxHp * HEAL_POTION_PERCENT / 100));
    playerPoke.stats.hp = Math.min(playerPoke.stats.hp + healAmount, playerPoke.stats.maxHp);

    for (const item of this.player.items) {
      if (!item.isRevive && item.healPercent > 0) {
        item.count--;
        break;
      }
    }

    this.actionLog.push('💊 使用了治疗药水！');
    this.actionLog.push(`❤️  ${playerPoke.name} 恢复了 ${healAmount} 点 HP！ (当前 HP: ${playerPoke.stats.hp}/${playerPoke.stats.maxHp})`);
    return true;
  }

  private handleSwitch(targetIndex: number): boolean {
    const aliveCount = this.player.team.filter(p => !p.isFainted()).length;

    if (aliveCount <= 1) {
      this.actionLog.push('❌ 没有其他可以出战的精灵了！');
      return false;
    }

    if (targetIndex < 0 || targetIndex >= this.player.team.length) {
      this.actionLog.push('无效的选择！');
      return false;
    }

    if (targetIndex === this.playerPokeIndex) {
      this.actionLog.push('❌ 这只精灵已经在出战中！');
      return false;
    }

    if (this.player.team[targetIndex].isFainted()) {
      this.actionLog.push('❌ 这只精灵已经失去战斗能力，无法出战！');
      return false;
    }

    this.playerPokeIndex = targetIndex;
    this.actionLog.push(`👉 切换 ${this.player.team[this.playerPokeIndex].name} 出战！`);
    this.actionLog.push('⚠️  消耗了一个回合！');
    return true;
  }

  private handleEscape(): boolean {
    const playerPoke = this.player.team[this.playerPokeIndex];
    const enemyPoke = this.wildPokemon!;

    const escapeChance = calculateEscapeChance(playerPoke.stats.speed, enemyPoke.stats.speed);
    const roll = Math.floor(Math.random() * 100);

    if (roll < escapeChance) {
      this.actionLog.push('🏃 成功逃脱了！');
      this.inBattle = false;
    } else {
      this.actionLog.push('🚫 逃跑失败了！');
    }

    return true;
  }

  private checkBattleEnd(): void {
    if (!this.inBattle || !this.wildPokemon) return;

    const playerPoke = this.player.team[this.playerPokeIndex];
    const enemyPoke = this.wildPokemon;

    if (enemyPoke.isFainted()) {
      this.actionLog.push(`💫 ${enemyPoke.name} 失去了战斗能力！`);
      this.actionLog.push('🎉 战斗胜利！获得了经验值！');
      this.player.gold += GOLD_WIN_BATTLE;
      this.actionLog.push(`💰 获得了 ${GOLD_WIN_BATTLE} 金币！`);

      playerPoke.exp += EXP_BASE_GAIN;
      if (playerPoke.exp >= playerPoke.maxExp) {
        playerPoke.level++;
        playerPoke.maxExp += EXP_LEVEL_BASE;
        this.actionLog.push(`🎊 ${playerPoke.name} 升到了 Lv.${playerPoke.level}！`);
      }

      this.inBattle = false;
      return;
    }

    if (playerPoke.isFainted()) {
      this.actionLog.push(`💫 ${playerPoke.name} 失去了战斗能力！`);

      let foundAlive = false;
      for (let i = 0; i < this.player.team.length; i++) {
        if (!this.player.team[i].isFainted()) {
          this.playerPokeIndex = i;
          foundAlive = true;
          this.actionLog.push(`👉 派出 ${this.player.team[i].name}！`);
          break;
        }
      }

      if (!foundAlive) {
        this.actionLog.push('💤 所有宝可梦都失去了战斗能力！');
        this.actionLog.push('🏃 被迫逃离了战斗！');
        this.inBattle = false;
      }
    }
  }

  private buildResult() {
    const playerPoke = this.player.team[this.playerPokeIndex];
    const enemyPoke = this.wildPokemon;
    return {
      battleEnded: !this.inBattle,
      actionLog: this.actionLog.join('\n'),
      playerPokeHp: playerPoke?.stats.hp ?? 0,
      enemyPokeHp: enemyPoke?.stats.hp ?? 0,
      playerPokeName: playerPoke?.name,
      enemyPokeName: enemyPoke?.name,
      caughtPokemon: !this.inBattle && enemyPoke?.isFainted() ? undefined : undefined,
    };
  }
}
