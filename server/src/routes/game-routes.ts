import { Router, Request, Response } from 'express';
import { sessionManager } from '../services/session-manager';
import { sessionMiddleware } from '../middleware/session';
import { DIRECTION_NAMES } from '../data/locations';
import { START_SPECIES } from '../data/species';
import { Pokemon } from '../models/pokemon';

const router = Router();

// POST /api/game/start
// 支持两种模式：无session创建新游戏，有session则为已有用户添加初始宝可梦
router.post('/start', (req: Request, res: Response) => {
  const { playerName, starterIndex } = req.body;

  if (starterIndex == null || starterIndex < 1 || starterIndex > 3) {
    res.status(400).json({ success: false, error: 'starterIndex 必须为 1, 2, 或 3' });
    return;
  }

  const species = START_SPECIES[starterIndex - 1];
  const sessionId = req.headers['x-session-id'] as string | undefined;

  // 已有会话（登录后选初始宝可梦）
  if (sessionId) {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      res.status(401).json({ success: false, error: '会话无效' });
      return;
    }
    const starter = new Pokemon(species, 5);
    session.player.addPokemon(starter);
    const loc = session.map.getCurrentLocation();

    res.json({
      sessionId: session.sessionId,
      playerName: session.player.name,
      currentLocation: loc.name,
      locationDescription: loc.description,
      totalPokeBalls: session.player.getTotalBalls(),
      teamCount: session.player.team.length,
      maxTeamSize: 6,
      team: session.player.getTeamData(),
    });
    return;
  }

  // 新建会话
  const session = sessionManager.createSession(playerName || 'Red', species);
  const loc = session.map.getCurrentLocation();

  res.json({
    sessionId: session.sessionId,
    playerName: session.player.name,
    currentLocation: loc.name,
    locationDescription: loc.description,
    totalPokeBalls: session.player.getTotalBalls(),
    teamCount: session.player.team.length,
    maxTeamSize: 6,
    team: session.player.getTeamData(),
  });
});

// POST /api/game/move (per api-contract.yaml)
router.post('/move', sessionMiddleware, (req: Request, res: Response) => {
  const { direction } = req.body;
  const session = req.gameSession!;

  if (!direction || !['e', 'w', 's', 'n'].includes(direction)) {
    res.status(400).json({ success: false, message: '无效的方向参数' });
    return;
  }

  if (session.battle.isInBattle()) {
    res.status(409).json({ success: false, message: '战斗中无法移动！' });
    return;
  }

  if (!session.map.tryMove(direction)) {
    res.status(400).json({
      success: false,
      message: '无法移动！那个方向没有路。',
    });
    return;
  }

  const newLoc = session.map.getCurrentLocation();
  const dirName = DIRECTION_NAMES[direction] || direction;
  const message = `向${dirName}移动，来到了【${newLoc.name}】`;

  let encounterWildPokemon = false;
  let wildPokemonSpecies: string | null = null;

  if (session.map.shouldEncounter()) {
    const wildPokemons = session.map.getWildPokemons();
    const index = Math.floor(Math.random() * wildPokemons.length);
    wildPokemonSpecies = wildPokemons[index];
    encounterWildPokemon = true;

    // 预先启动战斗（前端获取 battle/state 时会拿到完整状态）
    if (session.player.hasAlivePokemon()) {
      session.battle.start(wildPokemonSpecies);
    }
  }

  res.json({
    success: true,
    message,
    encounterWildPokemon,
    wildPokemonSpecies,
    newLocation: newLoc.name,
    newLocationDescription: newLoc.description,
  });
});

export default router;
