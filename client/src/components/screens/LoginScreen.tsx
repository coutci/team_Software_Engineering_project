import React, { useState } from 'react';
import { useGameState } from '../../store/game-context';
import { api, setSessionId } from '../../api/client';

interface Props {
  onLogin: (needsStarter: boolean) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const { dispatch } = useGameState();
  const [username, setUsername] = useState('Red');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setMsg('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setMsg('');

    try {
      if (isRegister) {
        const res = await api.post<{ success: boolean; error?: string; message?: string }>(
          '/auth/register', { username: username.trim(), password }
        );
        if (res.success) {
          setMsg('注册成功！请登录');
          setIsRegister(false);
        } else {
          setMsg(res.error || '注册失败');
        }
      } else {
        const res = await api.post<{
          success: boolean; error?: string; sessionId?: string;
          hasSave?: boolean; playerName?: string; gold?: number;
          teamCount?: number; maxTeamSize?: number; totalPokeBalls?: number;
          team?: any[];
        }>('/auth/login', { username: username.trim(), password });

        if (res.success && res.sessionId) {
          setSessionId(res.sessionId);
          dispatch({ type: 'SET_SESSION', sessionId: res.sessionId });
          dispatch({
            type: 'UPDATE_PLAYER',
            status: {
              playerName: res.playerName!,
              currentLocation: '',
              locationDescription: '',
              totalPokeBalls: res.totalPokeBalls ?? 0,
              teamCount: res.teamCount ?? 0,
              maxTeamSize: res.maxTeamSize ?? 6,
              gold: res.gold ?? 0,
            },
          });
          if (res.team) {
            dispatch({ type: 'UPDATE_TEAM', team: res.team, storage: [] });
          }
          onLogin(!res.hasSave);
        } else {
          setMsg(res.error || '登录失败');
        }
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a2a3a 50%, #0a1a0a 100%)',
      color: '#FFF', fontFamily: '"Microsoft YaHei", "SimHei", sans-serif',
    }}>
      <h1 style={{ fontSize: 44, color: '#FFD700', marginBottom: 8, textShadow: '2px 2px 4px #000' }}>
        宝可梦世界
      </h1>
      <p style={{ color: '#AAA', marginBottom: 28, fontSize: 15 }}>
        {isRegister ? '注册新账户' : '登录你的账户'}
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.05)', padding: 28, borderRadius: 16,
        border: '1px solid #333', width: 340,
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#CCC', display: 'block', marginBottom: 4 }}>用户名</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 16, borderRadius: 8,
              border: '2px solid #555', background: '#1a1a2e', color: '#FFF', outline: 'none',
            }}
            maxLength={20}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#CCC', display: 'block', marginBottom: 4 }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 16, borderRadius: 8,
              border: '2px solid #555', background: '#1a1a2e', color: '#FFF', outline: 'none',
            }}
            maxLength={30}
          />
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '12px', fontSize: 17, fontWeight: 'bold',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #FFD700, #FFA000)',
            color: '#1a1a2e', opacity: loading ? 0.6 : 1,
            marginBottom: 12,
          }}
        >
          {loading ? '请稍候...' : (isRegister ? '注册' : '登录')}
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setMsg(''); }}
            style={{
              background: 'none', border: 'none', color: '#64B5F6',
              cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
            }}
          >
            {isRegister ? '已有账户？去登录' : '没有账户？去注册'}
          </button>
        </div>

        {msg && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: msg.includes('成功') ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
            color: msg.includes('成功') ? '#4CAF50' : '#F44336',
            fontSize: 13, textAlign: 'center',
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
