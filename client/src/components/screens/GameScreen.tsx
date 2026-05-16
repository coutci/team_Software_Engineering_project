import React, { useEffect, useState } from 'react';
import { useGameState } from '../../store/game-context';
import { useGame } from '../../hooks/useGame';
import SceneCanvas from '../map/SceneCanvas';
import TeamScreen from './TeamScreen';
import ShopPanel from '../shop/ShopPanel';

const DIR_INFO: Record<string, { label: string; sym: string; row: number; col: number }> = {
  n: { label: '北', sym: '↑', row: 1, col: 2 },
  s: { label: '南', sym: '↓', row: 3, col: 2 },
  w: { label: '西', sym: '←', row: 2, col: 1 },
  e: { label: '东', sym: '→', row: 2, col: 3 },
};

const GameScreen: React.FC = () => {
  const { state } = useGameState();
  const { movePlayer, fetchMap, fetchStatus, quitGame, fetchBattleState } = useGame();
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    fetchMap();
    fetchStatus();
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showTeam || state.screen === 'battle') return;
      const dirs: Record<string, string> = {
        ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e',
        w: 'n', s: 's', a: 'w', d: 'e',
      };
      const dir = dirs[e.key];
      if (dir && state.map?.availableDirections.includes(dir)) {
        e.preventDefault();
        movePlayer(dir);
      }
      if (e.key === 't' || e.key === 'T') {
        setShowTeam(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showTeam, state.screen, state.map?.availableDirections, movePlayer]);

  // 检查是否有战斗
  useEffect(() => {
    if (state.screen === 'game') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/battle/state', {
            headers: { 'X-Session-Id': state.sessionId || '' },
          });
          const data = await res.json();
          if (data.inBattle) {
            fetchBattleState();
          }
        } catch { /* ignore */ }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state.screen, state.sessionId]);

  const locIdx = state.map?.currentLocationIndex ?? 0;
  const locName = state.map?.locationName ?? '';
  const availableDirs = state.map?.availableDirections ?? [];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a2a1a 100%)',
      color: '#FFF', fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
    }}>
      {/* 顶栏 */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 24px', background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid #333',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#FFD700' }}>宝可梦世界</h1>
          <span style={{ color: '#CCC' }}>训练家: {state.playerName}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#FFD700', fontSize: 14 }}>💰 {(state.playerStatus as any)?.gold ?? 0}</span>
          <span style={{ color: '#CCC', fontSize: 14 }}>
            🎒 {state.playerStatus?.totalPokeBalls ?? 0}
          </span>
          <span style={{ color: '#CCC', fontSize: 14 }}>
            👥 {state.playerStatus?.teamCount ?? 0}/{state.playerStatus?.maxTeamSize ?? 6}
          </span>
          <button onClick={() => setShowTeam(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #FFD700',
            background: 'rgba(255,215,0,0.1)', color: '#FFD700',
            cursor: 'pointer', fontSize: 14,
          }}>
            📋 队伍 (T)
          </button>
          <button onClick={quitGame} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #F44336',
            background: 'rgba(244,67,54,0.1)', color: '#F44336',
            cursor: 'pointer', fontSize: 14,
          }}>
            退出
          </button>
        </div>
      </header>

      {/* 主体 */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20, gap: 24 }}>
        {/* 左侧信息栏 */}
        <aside style={{
          width: 200, background: 'rgba(0,0,0,0.3)',
          borderRadius: 12, padding: 14, border: '1px solid #333',
          alignSelf: 'stretch',
        }}>
          <h3 style={{ color: '#FFD700', margin: '0 0 8px', fontSize: 16 }}>{locName}</h3>
          <p style={{ color: '#AAA', fontSize: 12, lineHeight: 1.5, margin: '0 0 12px' }}>
            {state.map?.locationDescription}
          </p>
          <div>
            <h4 style={{ color: '#CCC', fontSize: 12, marginBottom: 6 }}>🐾 可能遭遇：</h4>
            {state.map?.wildPokemons.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {state.map.wildPokemons.map((n, i) => (
                  <span key={i} style={{
                    padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
                    borderRadius: 10, fontSize: 11, color: '#CCC',
                  }}>
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: '#666', fontSize: 11 }}>安全区域</span>
            )}
          </div>
          <div style={{ marginTop: 14, color: '#666', fontSize: 11, lineHeight: 1.8 }}>
            <div>WASD / ↑↓←→ 移动</div>
            <div>T 队伍管理</div>
            <div>点方向按钮探索</div>
          </div>
        </aside>

        {/* 中间：场景 + 方向键十字布局 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 540px 80px',
          gridTemplateRows: '60px 540px 60px',
          gap: 8, alignItems: 'center', justifyItems: 'center',
        }}>
          {/* 场景 — 中间第2行第2列 */}
          <div style={{ gridRow: 2, gridColumn: 2 }}>
            <SceneCanvas locationIndex={locIdx} locationName={locName} />
          </div>
          {/* 四个方向按钮 */}
          <DirectionBtn dir="n" available={availableDirs} onMove={movePlayer} disabled={state.loading} />
          <DirectionBtn dir="s" available={availableDirs} onMove={movePlayer} disabled={state.loading} />
          <DirectionBtn dir="w" available={availableDirs} onMove={movePlayer} disabled={state.loading} />
          <DirectionBtn dir="e" available={availableDirs} onMove={movePlayer} disabled={state.loading} />
        </div>

        {/* 右侧：精灵中心时显示商店，否则占位 */}
        {locIdx === 4 ? (
          <ShopPanel />
        ) : (
          <div style={{ width: 200 }} />
        )}
      </main>

      {/* 通知 */}
      {state.notification && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)', color: '#FFD700',
          padding: '12px 24px', borderRadius: 10, fontSize: 16,
          zIndex: 500, border: '1px solid #FFD700',
        }}>
          {state.notification}
        </div>
      )}

      <TeamScreen visible={showTeam} onClose={() => setShowTeam(false)} />
    </div>
  );
};

// 方向按钮子组件
function DirectionBtn({ dir, available, onMove, disabled }: {
  dir: string; available: string[]; onMove: (d: string) => void; disabled: boolean;
}) {
  const info = DIR_INFO[dir];
  if (!info) return null;
  const canMove = available.includes(dir);
  return (
    <div style={{ gridRow: info.row, gridColumn: info.col }}>
      <button
        disabled={!canMove || disabled}
        onClick={() => canMove && onMove(dir)}
        style={{
          width: 64, height: 48, fontSize: 22, fontWeight: 'bold',
          borderRadius: 10, border: 'none',
          cursor: canMove ? 'pointer' : 'not-allowed',
          background: canMove
            ? 'linear-gradient(135deg, #FFD700, #FFA000)'
            : '#2a2a2a',
          color: canMove ? '#1a1a2e' : '#555',
          opacity: canMove ? 1 : 0.5,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 24 }}>{info.sym}</span>
        {info.label}
      </button>
    </div>
  );
}

export default GameScreen;
