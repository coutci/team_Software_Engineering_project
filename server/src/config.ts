// ==================== 战斗系统配置 ====================
export const DAMAGE_BASE_MULTIPLIER = 0.3;
export const STAB_MULTIPLIER = 1.5;
export const MIN_DAMAGE_MULTIPLIER = 0.85;
export const MAX_DAMAGE_MULTIPLIER = 1.0;
export const MIN_DAMAGE = 1;

export const EXP_BASE_GAIN = 20;
export const EXP_LEVEL_BASE = 50;

// ==================== 物品系统配置 ====================
export const HEAL_POTION_PERCENT = 33;
export const EXP_POTION_AMOUNT = 50;
export const REVIVE_HP_AMOUNT = 1;

// ==================== 遭遇系统配置 ====================
export const ENCOUNTER_CHANCE_PERCENT = 30;

// ==================== 逃跑系统配置 ====================
export const ESCAPE_BASE_CHANCE = 50;
export const ESCAPE_SPEED_MULTIPLIER = 2;
export const ESCAPE_MIN_CHANCE = 30;
export const ESCAPE_MAX_CHANCE = 95;

// ==================== 捕捉系统配置 ====================
export const CATCH_LEVEL_FACTOR_BASE = 0.2;
export const CATCH_MIN_PROBABILITY = 1.0;
export const CATCH_MAX_PROBABILITY = 100.0;
export const MASTERBALL_CATCH_RATE = 99.0;

// ==================== 队伍系统配置 ====================
export const MAX_TEAM_SIZE = 6;
export const POKEMONS_PER_PAGE = 5;

// ==================== 金币系统配置 ====================
export const GOLD_WIN_BATTLE = 100;
export const GOLD_CATCH_POKEMON = 50;

// ==================== 商店系统配置 ====================
export const SHOP_ITEMS = [
  { name: '精灵球', type: 'ball', ballIndex: 0, price: 50, description: '普通精灵球，捕捉倍率1.0' },
  { name: '超级球', type: 'ball', ballIndex: 1, price: 150, description: '超级球，捕捉倍率1.5' },
  { name: '高级球', type: 'ball', ballIndex: 2, price: 300, description: '高级球，捕捉倍率2.0' },
  { name: '大师球', type: 'ball', ballIndex: 3, price: 1000, description: '大师球，几乎必中' },
  { name: '治疗药水', type: 'item', itemIndex: 0, price: 30, description: '恢复33% HP' },
  { name: '经验药水', type: 'item', itemIndex: 1, price: 60, description: '获得50经验值' },
  { name: '复活药剂', type: 'item', itemIndex: 2, price: 100, description: '复活阵亡宝可梦' },
];

// ==================== 游戏系统配置 ====================
export const STARTER_POKEBALL = 10;
export const STARTER_GREATBALL = 3;
export const STARTER_ULTRABALL = 1;
export const STARTER_MASTERBALL = 0;
export const STARTER_HEAL_POTION = 5;
export const STARTER_EXP_POTION = 3;
export const STARTER_REVIVE = 2;
