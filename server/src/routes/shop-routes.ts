import { Router, Request, Response } from 'express';
import { sessionMiddleware } from '../middleware/session';
import { SHOP_ITEMS } from '../config';

const router = Router();

// GET /api/shop/items
router.get('/items', sessionMiddleware, (req: Request, res: Response) => {
  res.json({
    items: SHOP_ITEMS,
    playerGold: req.gameSession!.player.gold,
  });
});

// POST /api/shop/buy
router.post('/buy', sessionMiddleware, (req: Request, res: Response) => {
  const session = req.gameSession!;
  const { shopIndex, quantity } = req.body;
  const qty = quantity ?? 1;

  if (shopIndex == null || shopIndex < 0 || shopIndex >= SHOP_ITEMS.length) {
    res.status(400).json({ success: false, message: '无效商品' });
    return;
  }

  const shopItem = SHOP_ITEMS[shopIndex];
  const totalPrice = shopItem.price * qty;

  if (session.player.gold < totalPrice) {
    res.json({ success: false, message: `金币不足！需要 ${totalPrice}，拥有 ${session.player.gold}` });
    return;
  }

  session.player.gold -= totalPrice;

  if (shopItem.type === 'ball' && shopItem.ballIndex != null) {
    session.player.pokeballs[shopItem.ballIndex] += qty;
  } else if (shopItem.type === 'item' && shopItem.itemIndex != null) {
    session.player.items[shopItem.itemIndex].count += qty;
  }

  res.json({
    success: true,
    message: `购买了 ${qty} 个${shopItem.name}，花费 ${totalPrice} 金币`,
    gold: session.player.gold,
    ballCount: session.player.getTotalBalls(),
    ballCounts: [...session.player.pokeballs],
    items: session.player.items.map(it => ({
      name: it.name, count: it.count, healPercent: it.healPercent,
      expAmount: it.expAmount, isRevive: it.isRevive,
    })),
  });
});

export default router;
