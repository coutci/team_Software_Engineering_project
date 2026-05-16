import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/game-routes';
import playerRoutes from './routes/player-routes';
import mapRoutes from './routes/map-routes';
import battleRoutes from './routes/battle-routes';
import teamRoutes from './routes/team-routes';
import itemRoutes from './routes/item-routes';
import authRoutes from './routes/auth-routes';
import shopRoutes from './routes/shop-routes';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = parseInt(process.env.PORT || '4010', 10);

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/game', gameRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 全局错误处理
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`宝可梦 MUD 服务器已启动: http://127.0.0.1:${PORT}`);
  console.log(`API 文档: http://127.0.0.1:${PORT}/api/health`);
});

export default app;
