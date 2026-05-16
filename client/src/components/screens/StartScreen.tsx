import React, { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { useGameState } from '../../store/game-context';

const STARTERS = [
  { name: '小火龙', type: '火', color: '#F08030', desc: '火属性，尾巴上的火焰代表生命力' },
  { name: '杰尼龟', type: '水', color: '#6890F0', desc: '水属性，龟壳坚硬如铁' },
  { name: '妙蛙种子', type: '草', color: '#78C850', desc: '草属性，背上的种子蕴藏力量' },
];

interface Props {
  skipToGame: () => void;
}

const StartScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState('Red');
  const [selected, setSelected] = useState(1);
  const { startGame } = useGame();
  const { state } = useGameState();

  const handleStart = () => {
    startGame(playerName || 'Red', selected);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a2a3a 50%, #0a1a0a 100%)',
      color: '#FFF', fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
    }}>
      <h1 style={{ fontSize: 48, color: '#FFD700', marginBottom: 8, textShadow: '2px 2px 4px #000' }}>
        宝可梦世界
      </h1>
      <p style={{ color: '#AAA', marginBottom: 32, fontSize: 16 }}>
        选择你的初始伙伴，开始冒险之旅
      </p>

      {/* 名字输入 */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 12, color: '#CCC' }}>训练家名字：</label>
        <input
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          style={{
            padding: '8px 16px', fontSize: 16, borderRadius: 8,
            border: '2px solid #555', background: '#1a1a2e', color: '#FFF',
            outline: 'none', width: 200,
          }}
          maxLength={12}
        />
      </div>

      {/* 御三家选择 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
        {STARTERS.map((s, i) => {
          const idx = i + 1;
          const isSelected = selected === idx;
          return (
            <div
              key={s.name}
              onClick={() => setSelected(idx)}
              style={{
                width: 180, padding: 20, borderRadius: 12,
                background: isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                border: isSelected ? `3px solid ${s.color}` : '2px solid #333',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: s.color, margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, opacity: 0.8,
              }}>
                {idx === 1 ? '🔥' : idx === 2 ? '💧' : '🌿'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: '#AAA' }}>{s.desc}</div>
              {isSelected && (
                <div style={{ marginTop: 8, color: '#FFD700', fontSize: 14 }}>✓ 已选择</div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={state.loading}
        style={{
          padding: '14px 60px', fontSize: 20, fontWeight: 'bold',
          borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #FFD700, #FFA000)',
          color: '#1a1a2e', opacity: state.loading ? 0.6 : 1,
          transition: 'transform 0.2s', transform: 'scale(1)',
        }}
        onMouseEnter={e => { if (!state.loading) (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {state.loading ? '正在初始化...' : '开始冒险！'}
      </button>

      {state.error && (
        <div style={{ marginTop: 16, color: '#F44336', fontSize: 14 }}>
          {state.error}
        </div>
      )}
    </div>
  );
};

export default StartScreen;
