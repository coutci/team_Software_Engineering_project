import { Router, Request, Response } from 'express';
import { sessionMiddleware } from '../middleware/session';

const router = Router();

// GET /api/player/status (per api-contract.yaml)
router.get('/status', sessionMiddleware, (req: Request, res: Response) => {
  const session = req.gameSession!;
  const loc = session.map.getCurrentLocation();

  res.json({
    playerName: session.player.name,
    currentLocation: loc.name,
    locationDescription: loc.description,
    totalPokeBalls: session.player.getTotalBalls(),
    teamCount: session.player.team.length,
    maxTeamSize: 6,
    gold: session.player.gold,
  });
});

export default router;
