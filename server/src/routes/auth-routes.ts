import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/user-store';
import { sessionManager } from '../services/session-manager';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }

  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ success: false, error: '用户名需2-20个字符' });
    return;
  }

  if (password.length < 3) {
    res.status(400).json({ success: false, error: '密码至少3个字符' });
    return;
  }

  const user = registerUser(username, password);
  if (!user) {
    res.status(409).json({ success: false, error: '用户名已存在' });
    return;
  }

  res.json({ success: true, message: '注册成功，请登录' });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }

  const user = loginUser(username, password);
  if (!user) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }

  const session = sessionManager.loginSession(username);
  const loc = session.map.getCurrentLocation();

  res.json({
    success: true,
    sessionId: session.sessionId,
    hasSave: !!session.player.team.length,
    playerName: session.player.name,
    gold: session.player.gold,
    currentLocation: loc.name,
    locationDescription: loc.description,
    totalPokeBalls: session.player.getTotalBalls(),
    teamCount: session.player.team.length,
    maxTeamSize: 6,
    team: session.player.getTeamData(),
  });
});

export default router;
