'use client';

import { useState, useEffect } from 'react';

interface Character {
  id: number;
  name: string;
  level: number;
  exp: number;
  hp: number;
  max_hp: number;
  gold: number;
  str: number;
  dex: number;
  con: number;
  int_score: number;
  wis: number;
  cha: number;
}

interface Todo {
  id: number;
  title: string;
  str_exp: number;
  dex_exp: number;
  con_exp: number;
  int_exp: number;
  wis_exp: number;
  cha_exp: number;
  completed: number;
}

interface Dungeon {
  level: number;
  name: string;
  recommendedLevel: number;
}

interface Party {
  party_id: number;
  party_name: string;
  leader_id: number;
  leader_username: string;
}

interface PartyMember {
  user_id: number;
  username: string;
  character_id: number;
  character_name: string;
  level: number;
  str: number;
  dex: number;
  con: number;
  int_score: number;
  wis: number;
  cha: number;
  profession_id: number;
}

const API_BASE = 'http://' + window.location.hostname + ':10001/api';

export default function Home() {
  const [view, setView] = useState<'auth' | 'register' | 'game'>('auth');
  const [character, setCharacter] = useState<Character | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'dungeons' | 'teams'>('todos');
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>(['str', 'dex', 'con']);
  const [todoTitle, setTodoTitle] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [adventureResult, setAdventureResult] = useState<any>(null);

  // 组队状态
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [teamView, setTeamView] = useState<'no-party' | 'list' | 'in-party'>('no-party');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [partyNameInput, setPartyNameInput] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (activeTab === 'teams' && character) {
      loadTeamPanel();
    }
  }, [activeTab, character]);

  const getMod = (score: number) => Math.floor((score - 10) / 2);

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  };

  const checkLogin = async () => {
    const charId = localStorage.getItem('characterId');
    if (charId) {
      const res = await fetch(`/api/character/${charId}`);
      const data = await res.json();
      if (data.success) {
        setCharacter(data.character);
        setView('game');
        loadTodos(parseInt(charId));
        loadDungeons();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = (e.target as any).username.value;
    const password = (e.target as any).password.value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      setCharacter(data.character);
      localStorage.setItem('characterId', data.character.id);
      setView('game');
      loadTodos(data.character.id);
      loadDungeons();
    } else {
      showNotification(data.message, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = (e.target as any).username.value;
    const password = (e.target as any).password.value;

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      const newChar: Character = {
        id: data.characterId,
        name: username,
        level: 1,
        exp: 0,
        hp: 10,
        max_hp: 10,
        gold: 0,
        str: 10,
        dex: 10,
        con: 10,
        int_score: 10,
        wis: 10,
        cha: 10
      };
      setCharacter(newChar);
      localStorage.setItem('characterId', data.characterId);
      setView('game');
      loadTodos(data.characterId);
      loadDungeons();
      showNotification('欢迎来到土豆地城！', 'success');
    } else {
      showNotification(data.message, 'error');
    }
  };

  const loadTodos = async (charId: number) => {
    const res = await fetch(`/api/todos/${charId}`);
    const data = await res.json();
    if (data.success) setTodos(data.todos);
  };

  const loadDungeons = async () => {
    const res = await fetch('/api/dungeons');
    const data = await res.json();
    if (data.success) setDungeons(data.dungeons);
  };

  // ==================== 组队系统函数 ====================
  const loadTeamPanel = async () => {
    if (!character) return;

    const res = await fetch(`${API_BASE}/parties/user/${character.user_id}`);
    const data = await res.json();

    if (data.success && data.party) {
      setCurrentParty(data.party);
      await loadPartyMembers(data.party.party_id);
      setTeamView('in-party');
    } else {
      setCurrentParty(null);
      setPartyMembers([]);
      setTeamView('no-party');
    }
  };

  const createParty = async () => {
    if (!character || !partyNameInput.trim()) {
      showNotification('请输入队伍名称', 'error');
      return;
    }

    const res = await fetch(`${API_BASE}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: character.user_id,
        characterId: character.id,
        partyName: partyNameInput.trim()
      })
    });

    const data = await res.json();
    if (data.success) {
      showNotification('队伍创建成功！', 'success');
      setPartyNameInput('');
      setShowCreateModal(false);
      loadTeamPanel();
    } else {
      showNotification(data.message || '创建队伍失败', 'error');
    }
  };

  const leaveParty = async () => {
    // 立即给用户反馈
    showNotification('正在处理...', 'info');

    console.log('[leaveParty] 点击触发，isLeaving:', isLeaving);
    console.log('[leaveParty] currentParty:', currentParty);
    console.log('[leaveParty] character:', character);

    // 防止重复点击
    if (isLeaving) {
      console.log('[leaveParty] 正在处理中，忽略点击');
      return;
    }

    if (!currentParty) {
      console.log('[leaveParty] currentParty 为空');
      showNotification('队伍信息错误', 'error');
      return;
    }

    if (!character) {
      console.log('[leaveParty] character 为空');
      showNotification('角色信息错误', 'error');
      return;
    }

    setIsLeaving(true);
    const isLeader = currentParty.leader_id === character.user_id;

    const apiURL = `${API_BASE}/parties/${currentParty.party_id}/leave`;
    console.log('[leaveParty] API URL:', apiURL);
    console.log('[leaveParty] 准备发送请求', {
      partyId: currentParty.party_id,
      userId: character.user_id,
      isLeader
    });

    try {
      const res = await fetch(apiURL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: character.user_id
        })
      });

      console.log('[leaveParty] 响应状态:', res.status);
      console.log('[leaveParty] 响应类型:', res.type);

      const data = await res.json();
      console.log('[leaveParty] 响应数据:', data);

      if (data.success) {
        showNotification(data.message, 'success');
        loadTeamPanel();
      } else {
        showNotification(data.message || '离开队伍失败', 'error');
      }
    } catch (error) {
      console.error('[leaveParty] 请求失败:', error);
      showNotification('网络错误，请重试', 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const loadPartyMembers = async (partyId: number) => {
    const res = await fetch(`${API_BASE}/parties/${partyId}`);
    const data = await res.json();

    if (data.success && data.party && data.members) {
      setPartyMembers(data.members);
    }
  };

  const generateInviteCode = () => {
    if (!currentParty) return;
    const code = 'PD' + String(currentParty.party_id).padStart(6, '0');
    setInviteCode(code);
    showNotification('邀请码已生成！分享给朋友邀请他们加入。', 'success');
  };

  const getProfessionName = (professionId: number) => {
    const professions: { [key: number]: string } = {
      1: '战士',
      2: '法师',
      3: '盗贼',
      4: '圣骑士',
      5: '牧师'
    };
    return professions[professionId] || '无职业';
  };

  const createTodo = async () => {
    if (!todoTitle.trim() || !character) return;
    if (selectedAttrs.length === 0) {
      showNotification('请至少选择一个属性', 'error');
      return;
    }

    const exp: any = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    selectedAttrs.forEach(attr => exp[attr] = 1);

    const res = await fetch('/api/todos/' + character.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId: character.id,
        title: todoTitle,
        strExp: exp.str,
        dexExp: exp.dex,
        conExp: exp.con,
        intExp: exp.int,
        wisExp: exp.wis,
        chaExp: exp.cha
      })
    });
    const data = await res.json();

    if (data.success) {
      setTodoTitle('');
      loadTodos(character.id);
    }
  };

  const completeTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${character!.id}/${id}`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      setCharacter(data.character);
      loadTodos(character!.id);
      
      let msg = `完成！获得 ${data.expGained} 经验`;
      if (data.levelUp) msg += `，升级到 ${data.newLevel} 级！`;
      if (data.hpGained) msg += `，HP +${data.hpGained}`;
      showNotification(msg, 'success');
    }
  };

  const deleteTodo = async (id: number) => {
    await fetch(`/api/todos/${character!.id}/${id}`, { method: 'DELETE' });
    loadTodos(character!.id);
  };

  const toggleAttr = (attr: string) => {
    setSelectedAttrs(prev => 
      prev.includes(attr) 
        ? prev.filter(a => a !== attr)
        : [...prev, attr]
    );
  };

  const startAdventure = async (level: number) => {
    if (!character || character.hp <= 0) {
      showNotification('HP不足，无法冒险！先完成任务恢复HP。', 'error');
      return;
    }

    const res = await fetch('/api/dungeons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: character.id, dungeonLevel: level })
    });
    const data = await res.json();

    if (!data.success) {
      showNotification(data.message, 'error');
      return;
    }

    setCharacter(data.character);
    setAdventureResult(data.result);
    setShowResult(true);
  };

  const logout = () => {
    localStorage.removeItem('characterId');
    setView('auth');
    setCharacter(null);
  };

  if (view === 'auth' || view === 'register') {
    return (
      <div className="container">
        <div className="header">
          <h1>🥔 土豆地城</h1>
          <p>完成使命变得更强大！</p>
        </div>

        <div className="card">
          <h2>{view === 'auth' ? '🌟 开始冒险' : '🆕 创建新角色'}</h2>
          <form className="auth-form" onSubmit={view === 'auth' ? handleLogin : handleRegister}>
            <input name="username" placeholder="用户名" required />
            <input name="password" type="password" placeholder="密码" required />
            <button type="submit" className="btn btn-primary">
              {view === 'auth' ? '登录' : '创建'}
            </button>
            <button type="button" className="btn" onClick={() => setView(view === 'auth' ? 'register' : 'auth')}>
              {view === 'auth' ? '注册新角色' : '返回登录'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🥔 土豆地城</h1>
        <p>完成使命变得更强大！</p>
      </div>

      {/* 角色信息 */}
      <div className="card">
        <div className="character-info">
          <div>
            <h2>{character?.name}</h2>
            <span className="level">Lv.{character?.level}</span>
          </div>
          <div className="gold-display">💰 {character?.gold}</div>
        </div>
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${(character!.hp / character!.max_hp) * 100}%` }} />
        </div>
        <p style={{ textAlign: 'center', marginTop: 5 }}>
          ❤️ {character?.hp} / {character?.max_hp} HP | ✨ 经验: {Number(character?.exp)}/100
        </p>
      </div>

      {/* 属性面板 */}
      <div className="card">
        <h2>📊 属性</h2>
        <div className="stats-grid">
          {[
            { key: 'str', icon: '💪', name: '力量 STR' },
            { key: 'dex', icon: '🦵', name: '敏捷 DEX' },
            { key: 'con', icon: '❤️', name: '体质 CON' },
            { key: 'int_score', icon: '🧠', name: '智力 INT' },
            { key: 'wis', icon: '👁️', name: '感知 WIS' },
            { key: 'cha', icon: '✨', name: '魅力 CHA' }
          ].map(attr => (
            <div key={attr.key} className="stat-box">
              <div className="icon">{attr.icon}</div>
              <div className="name">{attr.name}</div>
              <div className="value">{character?.[attr.key as keyof Character]}</div>
              <div className="mod">{getMod((character?.[attr.key as keyof Character] as number) || 10) >= 0 ? '+' : ''}{getMod((character?.[attr.key as keyof Character] as number) || 10)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 标签页 */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>📝 任务</div>
        <div className={`tab ${activeTab === 'dungeons' ? 'active' : ''}`} onClick={() => setActiveTab('dungeons')}>⚔️ 地城</div>
        <div className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>👥 组队</div>
        <div className="tab" onClick={logout}>🚪 退出</div>
      </div>

      {activeTab === 'todos' && (
        <div className="card">
          <h2>📝 任务清单</h2>
          <div className="todo-input-group">
            <input 
              type="text" 
              value={todoTitle}
              onChange={e => setTodoTitle(e.target.value)}
              placeholder="新任务..." 
              onKeyDown={e => e.key === 'Enter' && createTodo()}
            />
            <button className="btn btn-primary" onClick={createTodo}>添加</button>
          </div>
          
          <div className="attribute-select">
            {[
              { key: 'str', icon: '💪' },
              { key: 'dex', icon: '🦵' },
              { key: 'con', icon: '❤️' },
              { key: 'int', icon: '🧠' },
              { key: 'wis', icon: '👁️' },
              { key: 'cha', icon: '✨' }
            ].map(attr => (
              <button
                key={attr.key}
                className={`attr-btn ${selectedAttrs.includes(attr.key) ? 'selected' : ''}`}
                onClick={() => toggleAttr(attr.key)}
              >
                {attr.icon}
              </button>
            ))}
          </div>
          
          <p style={{ color: '#666', fontSize: '0.9em', marginBottom: 15 }}>
            选中的属性完成任务后将获得经验值（每次 +1）
          </p>
          
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-info">
                  <h4>{todo.title}</h4>
                  <div className="exp-bonus">
                    {todo.str_exp ? '💪+' : ''}{todo.str_exp || ''}
                    {todo.dex_exp ? ' 🦵+' : ''}{todo.dex_exp || ''}
                    {todo.con_exp ? ' ❤️+' : ''}{todo.con_exp || ''}
                    {todo.int_exp ? ' 🧠+' : ''}{todo.int_exp || ''}
                    {todo.wis_exp ? ' 👁️+' : ''}{todo.wis_exp || ''}
                    {todo.cha_exp ? ' ✨+' : ''}{todo.cha_exp || ''}
                  </div>
                </div>
                <div className="todo-actions">
                  {!todo.completed ? (
                    <button className="btn btn-success btn-small" onClick={() => completeTodo(todo.id)}>完成</button>
                  ) : '✅'}
                  <button className="btn btn-danger btn-small" onClick={() => deleteTodo(todo.id)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'dungeons' && (
        <div className="card">
          <h2>⚔️ 地城冒险</h2>
          <p style={{ color: '#888', marginBottom: 15 }}>
            冒险会消耗体力并遭遇怪物。使用你的属性来战斗和通过检定！
          </p>
          <div className="dungeon-list">
            {dungeons.map(d => (
              <div key={d.level} className="dungeon-item">
                <div className="dungeon-info">
                  <h3>{d.name}</h3>
                  <div className="level-req">推荐等级: {d.recommendedLevel}</div>
                </div>
                <button className="btn btn-danger" onClick={() => startAdventure(d.level)}>进入</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 组队面板 */}
      {activeTab === 'teams' && (
        <div className="card">
          <h2>👥 组队系统</h2>

          {teamView === 'no-party' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '4em', marginBottom: 20 }}>🚫</div>
              <p style={{ color: '#888', marginBottom: 20 }}>你还没有加入任何队伍</p>
              <div style={{ display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>➕ 创建队伍</button>
              </div>
            </div>
          )}

          {teamView === 'list' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>📋 可加入的队伍</h3>
                <button className="btn btn-primary btn-small" onClick={() => setShowCreateModal(true)}>➕ 创建队伍</button>
              </div>
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                暂无可用队伍<br />
                创建一个队伍邀请朋友加入吧！
              </div>
            </div>
          )}

          {teamView === 'in-party' && (
            <div>
              <div style={{ textAlign: 'center', padding: 20, background: 'rgba(39,174,96,0.1)', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontSize: '3em', marginBottom: 10 }}>✅</div>
                <h3>{currentParty?.party_name}</h3>
                <p style={{ color: '#888', marginTop: 10 }}>
                  {partyMembers.length}/4 人 | 队长: {currentParty?.leader_username}
                </p>
              </div>

              <h3 style={{ marginBottom: 15 }}>👥 队伍成员</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {partyMembers.map(member => (
                  <div key={member.user_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>
                        {member.username} {member.user_id === currentParty?.leader_id ? '👑' : ''}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.9em' }}>
                        {member.character_name} · Lv.{member.level} · {getProfessionName(member.profession_id)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ padding: '3px 8px', background: 'rgba(243,156,18,0.2)', borderRadius: 4, color: '#f39c12', fontSize: '0.8em', fontWeight: 'bold' }}>💪{member.str}</span>
                      <span style={{ padding: '3px 8px', background: 'rgba(52,152,219,0.2)', borderRadius: 4, color: '#3498db', fontSize: '0.8em', fontWeight: 'bold' }}>🧠{member.int_score}</span>
                      <span style={{ padding: '3px 8px', background: 'rgba(46,204,113,0.2)', borderRadius: 4, color: '#2ecc71', fontSize: '0.8em', fontWeight: 'bold' }}>❤️{member.con}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: 15, background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                <h4 style={{ marginBottom: 10 }}>💬 邀请队友</h4>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={generateInviteCode}>🔗 生成邀请码</button>
                </div>
                {inviteCode && (
                  <div style={{ marginTop: 15, padding: 15, background: 'rgba(243,156,18,0.1)', border: '2px dashed #f39c12', borderRadius: 10, textAlign: 'center' }}>
                    <p style={{ color: '#f39c12', marginBottom: 5 }}>邀请码</p>
                    <div style={{
                      fontFamily: 'Courier New, monospace',
                      fontSize: '1.5em',
                      fontWeight: 'bold',
                      color: '#f39c12',
                      letterSpacing: 3
                    }}>{inviteCode}</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  className="btn btn-danger"
                  onClick={leaveParty}
                  disabled={isLeaving}
                  style={{
                    opacity: isLeaving ? 0.6 : 1,
                    cursor: isLeaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLeaving ? '⏳ 处理中...' : '🚪 离开队伍'}
                </button>
              </div>
            </div>
          )}

          {/* 创建队伍弹窗 */}
          {showCreateModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="card" style={{ maxWidth: 400, width: '90%' }}>
                <h2>➕ 创建队伍</h2>
                <input
                  type="text"
                  value={partyNameInput}
                  onChange={e => setPartyNameInput(e.target.value)}
                  placeholder="队伍名称"
                  style={{
                    width: '100%',
                    padding: 12,
                    marginBottom: 15,
                    border: 'none',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn" onClick={() => { setShowCreateModal(false); setPartyNameInput(''); }}>取消</button>
                  <button className="btn btn-primary" onClick={createParty}>创建</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 冒险结果弹窗 */}
      {showResult && adventureResult && (
        <div className="card">
          <div className="adventure-result">
            <div className="result-icon">
              {adventureResult.type === 'combat' ? (adventureResult.monsterDefeated ? '⚔️' : '💀') :
               adventureResult.type === 'treasure' ? '💰' :
               adventureResult.type === 'trap' ? '💥' : '😴'}
            </div>
            <h2>
              {adventureResult.type === 'combat' ? (adventureResult.monsterDefeated ? '战斗胜利！' : '战斗撤退') :
               adventureResult.type === 'treasure' ? '发现宝藏！' :
               adventureResult.type === 'trap' ? '触发陷阱！' : '平安无事'}
            </h2>
            <p style={{ color: '#888', marginTop: 10 }}>{adventureResult.description}</p>
            
            <div className="rewards">
              <div className="reward">
                <div className="value">+{adventureResult.gold || 0}</div>
                <div className="label">💰 金币</div>
              </div>
              <div className="reward">
                <div className="value">+{adventureResult.exp || 0}</div>
                <div className="label">✨ 经验</div>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowResult(false)}>继续</button>
          </div>
        </div>
      )}
    </div>
  );
}
