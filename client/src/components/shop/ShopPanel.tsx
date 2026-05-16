import React, { useState, useEffect } from 'react';
import { useGameState } from '../../store/game-context';
import { api } from '../../api/client';

interface ShopItem {
  name: string; type: string; ballIndex?: number;
  itemIndex?: number; price: number; description: string;
}

interface ShopData {
  items: ShopItem[];
  playerGold: number;
}

const ShopPanel: React.FC = () => {
  const { state, dispatch } = useGameState();
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const data = await api.get<ShopData>('/shop/items');
      setShopData(data);
    } catch { /* ignore */ }
  };

  const handleBuy = async (index: number) => {
    setMsg('');
    try {
      const res = await api.post<{
        success: boolean; message: string; gold: number;
        ballCount: number; ballCounts: number[]; items: any[];
      }>('/shop/buy', { shopIndex: index, quantity: 1 });

      if (res.success) {
        setShopData(prev => prev ? { ...prev, playerGold: res.gold } : null);
        dispatch({
          type: 'UPDATE_PLAYER',
          status: {
            ...(state.playerStatus!),
            totalPokeBalls: res.ballCount,
            gold: res.gold,
            playerName: state.playerStatus?.playerName ?? '',
            currentLocation: state.playerStatus?.currentLocation ?? '',
            locationDescription: state.playerStatus?.locationDescription ?? '',
            teamCount: state.playerStatus?.teamCount ?? 0,
            maxTeamSize: state.playerStatus?.maxTeamSize ?? 6,
          },
        });
        dispatch({ type: 'UPDATE_ITEMS', items: res.items });
      }
      setMsg(res.message);
      setTimeout(() => setMsg(''), 3000);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : '购买失败');
    }
  };

  if (!shopData) return null;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.45)', borderRadius: 12,
      padding: 14, border: '2px solid #FFD700',
      minWidth: 220,
    }}>
      <h3 style={{ color: '#FFD700', margin: '0 0 4px', fontSize: 16, textAlign: 'center' }}>
        🏪 精灵中心商店
      </h3>
      <div style={{
        textAlign: 'center', color: '#FFD700', fontSize: 14, marginBottom: 10,
        padding: '4px 0', borderBottom: '1px solid #333',
      }}>
        💰 金币: {shopData.playerGold}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shopData.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', background: 'rgba(255,255,255,0.04)',
            borderRadius: 8, border: '1px solid #333',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FFF', fontSize: 13, fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ color: '#888', fontSize: 10 }}>{item.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#FFD700', fontSize: 12 }}>${item.price}</span>
              <button
                disabled={shopData.playerGold < item.price}
                onClick={() => handleBuy(i)}
                style={{
                  padding: '3px 12px', borderRadius: 6, fontSize: 11, fontWeight: 'bold',
                  border: '1px solid #FFD700',
                  background: shopData.playerGold >= item.price
                    ? 'rgba(255,215,0,0.15)' : '#222',
                  color: shopData.playerGold >= item.price ? '#FFD700' : '#555',
                  cursor: shopData.playerGold >= item.price ? 'pointer' : 'not-allowed',
                }}
              >
                购买
              </button>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 6,
          background: msg.includes('金币不足') ? 'rgba(244,67,54,0.12)' : 'rgba(76,175,80,0.12)',
          color: msg.includes('金币不足') ? '#F44336' : '#4CAF50',
          fontSize: 12, textAlign: 'center',
        }}>
          {msg}
        </div>
      )}
    </div>
  );
};

export default ShopPanel;
