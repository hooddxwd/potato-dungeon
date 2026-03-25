# 🎮 土豆地城 - 开发追踪

---

## 📅 当前状态

**开发阶段**：回合制战斗+多层地城完成
**上线时间**：2026-02-25
**最后更新**：2026-02-26 11:30

---

## 🎯 开发任务清单

### 阶段一：基础系统优化（已实现 ✅）

- [x] 用户注册/登录系统
- [x] 角色创建
- [x] 6大属性（STR, DEX, CON, INT, WIS, CHA）
- [x] 属性经验系统（25点升1点属性）
- [x] 任务系统（简单/普通/困难）
- [x] 体力系统（消耗2-15点/次冒险）
- [x] 7个地城系统
- [x] 文字战斗界面
- [x] 装备系统（掉落/穿戴/出售）
- [x] 商店系统（药水/装备）

**完成时间**：2026-02-25 14:00

---

### 阶段二：职业系统（已完成 ✅）

- [x] 创建 professions 表
- [x] 5种职业基础配置
  - 战士（Warrior）- STR+2, CON+1, 被动技：盾牌格挡、坚韧，主动技：冲锋、战吼
  - 法师（Mage）- INT+2, WIS+1, 被动技：魔法抗性、法力涌动，主动技：火球术、冰霜术
  - 盗贼（Rogue）- DEX+2, STR+1, CHA+1, 被动技：暴击大师、潜行大师，主动技：背刺、潜行
  - 圣骑士（Paladin）- STR+1, CON+1, WIS+1, CHA+1, 被动技：神圣光环、不屈，主动技：圣光术、护盾
  - 牧师（Cleric）- WIS+2, CON+1, CHA+1, 被动技：净化光环、虔诚，主动技：治疗术、净化术
- [x] 职业被动技能
- [x] 职业主动技能
- [x] 创建时选择职业
- [x] 职业影响属性加成
- [x] 前端职业选择界面

**完成时间**：2026-02-26 09:40

---

### 阶段三：地城优化（进行中 ⚡）

- [ ] 多层房间系统（每个地城5-8层，每层3-8个房间）
- [ ] 房间类型扩展（休息/宝箱/陷阱/商人/谜题）
- [ ] 隐藏房间系统（感知检定发现）
- [ ] 地城地图系统（探索进度可视化）
- [ ] 房间传送门
- [ ] 每层Boss战（第5-8层是Boss房间）

**预计完成**：2026-02-27 18:00

---

### 阶段四：回合制战斗系统（已完成 ✅）

- [x] 创建 dungeon_runs 表（地城运行状态）
- [x] 创建 battle_states 表（战斗状态）
- [x] 多层地城系统
  - [x] 5-8 层随机生成
  - [x] 每层 3-8 个房间
  - [x] 房间类型（战斗/宝箱/陷阱/事件/休息/Boss）
- [x] 回合制战斗 API
  - [x] `POST /api/dungeon/start` - 开始地城
  - [x] `POST /api/dungeon/explore` - 探索房间
  - [x] `POST /api/battle/action` - 战斗行动（攻击/技能）
- [x] 技能战斗集成
  - [x] 火球术/冰霜术（魔法伤害）
  - [x] 治疗术/圣光术（治疗）
  - [x] 技能消耗 MP
- [ ] 被动技能自动生效
  - [ ] 盾牌格挡（减少受到的伤害）
  - [ ] 暴击大师（增加暴击几率）
  - [ ] 魔法抗性（减少魔法伤害）
  - [ ] 神圣光环（定期恢复HP）
- [ ] 前端战斗界面集成
  - [ ] 地城探索界面
  - [ ] 战斗界面（攻击/技能按钮）
  - [ ] 技能列表显示
  - [ ] 战斗日志

**预计完成**：2026-02-28 18:00

---

### 阶段五：战斗系统重构（进行中 🗡）

- [ ] 回合制战斗（玩家和怪物各一个回合）
- [ ] 战斗AI优化（根据怪物类型选择策略）
- [ ] 状态效果系统
  - 毒液、燃烧、恐惧、减速、冰冻
  - 无敌免疫、石化等
- [ ] 装备强化系统
  - 同品质装备合成（2→1）
  - 合成成功率（60%）
  - 材料掉落系统

**预计完成**：2026-03-01 18:00

---

### 阶段六：经济系统完善（进行中 💰）

- [ ] 装备价格优化
- [ ] 钻石系统
- [ ] 材料掉落系统
  - 亡灵骨、火焰精华、龙血
  - 合成所需材料表
- [ ] 装备突破（传说级装备+1级）

**预计完成**：2026-03-02 18:00

---

### 阶段七：社交与公会（计划中 👥）

- [ ] 好友列表
- [ ] 好友状态（在线/离线）
- [ ] 好友挑战（1v1战斗）
- [ ] 好友聊天
- [ ] 公会创建/加入
- [ ] 公会任务（每周目标）
- [ ] 公会商店（折扣）
- [ ] 公会技能树（共享被动技能）

**预计完成**：2026-03-03 18:00

---

## 📋 详细开发任务

### 任务 1：职业系统（明天）

```javascript
// 后端实现

// 1. 创建 professions 表
CREATE TABLE professions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  description TEXT,
  base_stats JSON NOT NULL,
  skills JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

// 2. 插入初始职业数据
INSERT INTO professions (name, display_name, description, base_stats, skills) VALUES
('warrior', '战士', '擅长近战，高血量', '{"str":1,"con":1,"dex":0,"int":0,"wis":0,"cha":0}', '{"passive":["盾牌格挡"],"active":["冲锋","战吼"]}')
('mage', '法师', '擅长魔法攻击', '{"str":0,"con":0,"dex":0,"int":1,"wis":1,"cha":0}', '{"passive":["魔法抗性"],"active":["火球术","冰霜术"]}')
('rogue', '盗贼', '擅长暴击和闪避', '{"str":0,"dex":1,"con":0,"int":0,"wis":0,"cha":1}', '{"passive":["暴击大师"],"active":["背刺","潜行"]}')
('paladin', '圣骑士', '擅长防御和治疗', '{"str":1,"con":1,"dex":0,"int":0,"wis":1,"cha":1}', '{"passive":["神圣光环"],"active":["圣光术","护盾"]}')
('cleric', '牧师', '擅长治疗', '{"str":0,"con":1,"dex":0,"int":0,"wis":1,"cha":1}', '{"passive":["净化光环"],"active":["治疗术","净化术"]}')
```

// 3. API 端点
POST /api/professions - 获取职业列表
POST /api/character/:id/class - 选择职业

// 4. 前端更新
- 创建角色时选择职业界面
- 角色信息显示职业加成

```

**任务 2：技能系统（后天）**

```javascript
// 后端实现

// 1. 创建 player_skills 表
CREATE TABLE player_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  skill_id INT NOT NULL,
  level INT DEFAULT 1,
  mastered BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

// 2. 技能数据（从 professions 表引用）
CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profession_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  description TEXT,
  type ENUM('passive','active') NOT NULL,
  mp_cost INT DEFAULT 0,
  cooldown INT DEFAULT 0,
  effect_data JSON NOT NULL
);

// 3. 技能使用 API
POST /api/skills/:characterId - 获取技能列表
POST /api/skills/:characterId/:skillId - 学习技能

// 4. 前端更新
- 战斗界面添加技能按钮
- 显示 MP 条
- 技能冷却显示

```

**任务 3：多层地城（大后天）**

```javascript
// 后端实现

// 1. 修改 dungeons 表添加 floors 字段
ALTER TABLE dungeons ADD COLUMN floors INT DEFAULT 5;

// 2. 创建 dungeon_floors 表
CREATE TABLE dungeon_floors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dungeon_id INT NOT NULL,
  floor_number INT NOT NULL,
  rooms JSON NOT NULL,
  monsters JSON NOT NULL,
  boss_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

// 3. 生成房间数据
CREATE TABLE rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('normal','treasure','trap','rest','merchant','puzzle','boss') NOT NULL,
  description TEXT,
  loot JSON NOT NULL,
  event_chance INT NOT NULL
);

// 4. 房间逻辑 API
POST /api/dungeons/:dungeonId/enter - 进入地城
POST /api/dungeons/:dungeonId/:floorNumber/enter - 进入楼层
POST /api/dungeons/:dungeonId/:floorNumber/room/:roomId/enter - 进入房间

// 5. 前端更新
- 地城界面显示当前层数
- 房间进度可视化
- 小地图显示

```

---

## 🎮 功能清单

### 已完成 ✅
- 用户系统
- 6大属性系统
- 属性经验系统
- 任务系统（难度选择）
- 7个地城系统
- 装备系统（7个部位）
- 商店系统
- ~~体力系统~~（已移除）
- 职业系统（5种职业，属性加成）
- 技能系统后端（技能数据库、学习API）
- 多层地城后端（5-8层，每层3-8房间）
- 回合制战斗后端（攻击、技能、MP消耗）

### 进行中 ⏳
- 前端战斗界面（地城探索、战斗UI、技能按钮）
- 被动技能生效
- 状态效果系统（毒/燃烧/减速等）

### 计划中 🗡
- 装备强化系统（合成、材料）
- 公会系统（创建/任务）
- 地图系统
- PVP 战场
- 成就系统

---

### 阶段八：组队系统优化（已开发基础，待完善）👥

#### 已完成 ✅
- 后端 API（创建/加入/离开队伍）
- 前端组队 UI（标签页、创建弹窗、成员列表）
- 邀请码生成（基于队伍ID）
- 队伍信息展示（成员、职业、属性）
- **邀请码验证系统**（通过邀请码加入队伍）
- **邀请码输入界面**
- **一键复制邀请码功能**
- **队长管理功能**（踢出成员、转让队长）
- **队长权限验证**
- **成员列表操作按钮**（仅队长可见）
- **队伍大厅**（显示所有公开队伍列表）
- **队伍大厅筛选**（等级、人数、搜索功能）
- **队伍大厅分页控件**
- **WebSocket实时同步服务器**（连接管理、房间管理、实时通知）
- **前端WebSocket客户端**（自动连接、自动重连、消息处理）
- **组队地城副本**（后端完整实现）
  - 组队地城启动 API
  - 组队房间探索 API
  - 组队战斗行动 API
  - 队长权限验证
  - 成员等级验证
  - 独立地城运行记录
  - 房间事件、战斗系统、技能支持
  - 经验/金币奖励
  - WebSocket实时通知
- **组队地城副本前端UI**（选择弹窗、成员状态、战斗同步）
  - 组队地城选择弹窗
  - 根据成员等级筛选地城
  - 开启组队地城按钮
  - 队伍成员状态显示（HP/MP/等级）
  - 自动同步地城数据
  - WebSocket组队地城事件处理

#### 待开发任务 ⏳

**任务 1：队伍聊天**（最后一个任务）
- **优先级**：🟢 极低
- **预计时间**：4-5 小时

#### 后端
- [ ] `POST /api/party/chat` - 发送聊天消息
- [ ] 消息历史记录（可选）
- [ ] WebSocket 消息广播

#### 前端
- [ ] 队伍内文字聊天界面
- [ ] 消息气泡显示
- [ ] 输入框 + 发送按钮
- [ ] 自动滚动到最新消息
- [ ] 快捷指令按钮（"救命"、"集合"等）

#### 测试
- [ ] 测试发送消息
- [ ] 测试实时接收
- [ ] 测试消息历史
- [ ] 测试快捷指令

**预计完成时间**：2026-03-05 18:00

---

*最后更新：2026-03-02 15:10*
