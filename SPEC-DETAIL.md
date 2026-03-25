# 🎮 土豆地城 - 详细规格 v1.1

---

## 一、核心机制

### 1.1 属性系统 (DND 6大属性)

| 属性 | 作用 | 升级效果 |
|------|------|----------|
| 力量 STR | 物理攻击、近战伤害 | +1 力量 +2 HP 上限 |
| 敏捷 DEX | 闪避率、远程攻击、先手 | +1 敏捷 +10% 闪避率 |
| 体质 CON | HP 上限、防御、HP 回复速度 | +1 体质 +5 HP |
| 智力 INT | 魔法攻击、技能成功率 | +1 智力 +0.5 技能成功率 |
| 感知 WIS | 陷阱发现率、Boss 暴击抵抗 | +1 感知 +15% 陷阱发现率 |
| 魅力 CHA | 掉落率、NPC 好感度 | +1 魅力 +5% 掉落率 |

### 1.2 属性成长机制

```
基础属性 = 初始值 10
每次升级 = +1 点属性（可选择提升哪个）
每 25 点属性经验 = 属性 +1
```

### 1.3 战斗公式

```
命中判定 = 50 + D20 + (玩家攻击修正 - 敌人防御)
暴击判定 = 感知 >= 15 ? 15% : 5%

基础伤害 = MAX(1, 玩家攻击力 - 敌人防御)
暴击伤害 = 基础伤害 × 2

最终伤害 = MAX(0, 玩家伤害 - 敌人防御)
敌人受到伤害 = MAX(0, 敌人伤害 - 玩家防御 × 0.5)

闪避判定 = 50 + D20 + (玩家敏捷 - 敌人敏捷)
闪避率 = Math.min(95, 50 + 玩家敏捷 - 敌人敏捷)
```

### 1.4 状态效果

| 状态 | 持续时间 | 恢复量 | 效果 |
|------|----------|--------|--------|
| 毒液 | 3 回合 | 每回合 -2 HP | 减速 20% |
| 燃烧 | 3 回合 | 每回合 -2 HP | 无法闪避 |
| 恐惧 | 2 回合 | 无法攻击 | 敌人命中率 -30% |
| 眩空 | 2 回合 | 暴击率 -20% | 敌人无法主动 |
| 石化 | 2 回合 | 防御力 -50% | 无效免疫 |
| 沉默 | 2 回合 | 无法使用技能 | 无法攻击/治疗 |
| 冰冻 | 3 回合 | 速度 -50% | 无法闪避/攻击 |

---

## 二、职业系统

### 2.1 职业列表

| 职业 | 核心属性 | 主动技能 (Lv) | 被动技能 (Lv) |
|------|----------|--------------|--------------|
| 战士 | STR++, CON++ | 【冲锋】消耗 5 MP | 【盾牌格挡】消耗 10 MP |
| 法师 | INT++, WIS++ | 【火球术】消耗 15 MP | 【冰霜术】消耗 20 MP |
| 盗贼 | DEX++, STR++ | 【背刺】消耗 3 MP | 【潜行】消耗 5 MP |
| 牧师 | WIS++, CHA++ | 【治疗术】消耗 10 MP | 【净化术】消耗 20 MP |
| 游侠 | STR++, CON++, CHA++ | 【旋风斩】消耗 20 MP | 【鼓舞】消耗 30 MP |

### 2.2 技能系统

#### 2.2.1 技能结构
```javascript
{
  id: 1,
  name: "冲锋",
  class: "warrior",
  level: 1,
  cost: 5,
  description: "向敌人发起猛烈冲锋，下次攻击 +30%",
  cooldown: 0,
  target: "enemy",
  type: "attack",
  effect: "bonus_atk"
}
```

#### 2.2.2 技能冷却时间
```
基础技能：3 回合
主动技能：5 回合
职业专长：-1 回合
```

### 2.3 被动技能效果

```
战士-【盾牌格挡】：受到伤害 -30%，反击
法师-【暴击加成】：基础暴击率 +10%
盗贼-【潜行】：下回合闪避率 +30%，敌人无法攻击
牧师-【治疗祷】: 所有队友 +15 HP
```

---

## 三、装备系统

### 3.1 装备槽位

| 槽位 | 数量 | 装备类型 | 属性加成 |
|------|------|----------|----------|
| 武器 | 1 | 武器 | STR, DEX, INT, WIS |
| 戒指 | 1 | 戒指 | DEX, INT, WIS |
| 头盔 | 1 | 头盔 | CON, DEX |
| 护甲 | 1 | 护甲 | CON, STR |
| 戒指 | 1 | 戒指 | DEX, INT, WIS |
| 鞋子 | 1 | 鞋子 | DEX, CHA |
| 披风 | 1 | 披风 | DEX, CHA |

### 3.2 装备品质与属性加成

| 品质 | 掉落率 | 基础属性 | 最大属性 |
|------|-------|----------|----------|
| 普通 | 30% | 1-2 | 0 |
| 优秀 | 15% | 3-4 | 0 |
| 稀有 | 7% | 5-7 | 0 |
| 史诗 | 3% | 8-12 | 0 |
| 传说 | 1% | 13-20 | 0 |

### 3.3 装备掉落规则

```
普通怪物掉落：30% 几率
Boss 掉落：100% 几率
地城等级影响：
- 地城 1-3：只掉普通
- 地城 4-6：可以掉优秀（20%）
- 地城 7：可以掉稀有（5%）
- 地城 8：可以掉史诗（1%）
```

---

## 四、地城系统

### 4.1 地城配置

| 地城 | 等级 | 推荐等级 | 消耗体力 | 层数 | 怪物 | Boss | 事件 | 特色 |
|------|--------|--------|------|--------|--------|--------|----------|
| 1. 土豆洞穴 | 1 | 2 | 3 | 2 | 3 | 3 | 4 | 史莱姆 |
| 2. 哥布林营地 | 3 | 3 | 4 | 3 | 4 | 3 | 哥布林 | 哥布林 | 狼 | 3 | 4 | 精英 |
| 3. 地下墓穴 | 5 | 4 | 4 | 5 | 5 | 4 | 3 | 骷髅 | 僵尸 | 3 | 5 | 精英 |
| 4. 兽人要塞 | 7 | 5 | 5 | 5 | 4 | 4 | 3 | 兽人 | 野狼 | 3 | 5 | 大地精 |
| 5. 构造体工坊 | 9 | 6 | 6 | 5 | 4 | 4 | 3 | 石魔像 | 铁魔像 | 3 | 5 | 精英 |
| 6. 龙之巢穴 | 11 | 8 | 6 | 6 | 5 | 3 | 4 | 3 | 幼龙 | 双足飞龙 | 3 | 6 | 精英 |
| 7. 恶魔领域 | 13 | 10 | 7 | 6 | 3 | 4 | 3 | 恶魔 | 炼狱犬 | 3 | 6 | 小魔鬼 | 3 | 7 | 精英 |

### 4.2 房间类型

```
战斗房：遭遇 1-3 个怪物
宝箱房：打开宝箱，获得金币/装备
陷阱房：触发陷阱，受到伤害
休息房：可以恢复 HP，消耗金币
商店房：可以购买物品/装备
Boss 房：Boss 战，击败后进入下一层
```

### 4.3 事件池

| 事件类型 | 触发条件 | 效果 | 金币 | 经验 | 装备 |
|----------|----------|--------|--------|-------|--------|
| 宝箱 | 探索房间 | +15-30 | +10-20 | 30% | 0 |
| 陷阱 | 敏捷检定失败 | 受到伤害 | 0 | 0 | 10% | 0 |
| 陷阱 | 敏捷检定成功 | 躢过 | 0 | 0 | 5% | 0 |
| 陷阱 | 感知检定成功 | 发现隐藏房间 | +10 | 0 | 20% | 0 |
| 商人 | 随机遇到 | 购买物品 | -价格 | 0 | 0 | 0 | 0 |
| 商人 | 出售装备 | 获得金币 | 50% 价格 | 0 | 0 | 0 |
| 祭坛 | 使用祭坛 | 完全恢复 | 0 | 0 | 20 | 0 | 0 |
| 谜题 | 成功完成 | +15-30 | 0 | 0 | 10% | 0 |

---

## 五、战斗流程

### 5.1 回合制

```
玩家回合：
1. 玩家选择动作（攻击、防御、技能、道具、逃跑）
2. 计算命中/闪避
3. 施加效果（如有）
4. 敌人回合（如存活）

战斗结束条件：
- 玩家 HP <= 0（死亡）
- 敌人 HP <= 0（被击败）
- 玩家逃跑成功

死亡惩罚：
- 失去 10% 金币
- 属性经验 -50%
- 需要 1 分钟复活
```

### 5.2 逃亡机制

```
逃跑判定 = 敏捷检定
成功率 = 50 + D20 + (玩家敏捷 - 敌人敏捷) / 2 + 10%
逃跑惩罚 = 10% 当前体力（最少消耗 2 点）
```

---

## 六、经济系统

### 6.1 货币获取

```
来源：
1. 完成任务：+10-50 金币（根据任务难度）
2. 击败怪物：+5-20 金币
3. 出售装备：获得原价 50-90% 金币
4. 商店购买：消耗金币
5. 地城事件：+15-500 金币（宝箱、奖励）
6. 公会奖励：每周 +100 金币
```

### 6.2 消耗

```
进入地城：2-15 体力/层
使用技能：5-30 MP
购买物品：消耗金币
刷新体力药水：100 金币（恢复 50 点）
复活：200 金币（快速复活）
```

---

## 七、技能系统

### 7.1 技能树

每个职业有独立的技能树：

#### 战士技能树
```
[冲锋] (Lv1)
  └─> [盾牌格挡] (Lv3)
      └─> [战吼] (Lv5)
        └─> [致死打击] (Lv10)

[剑术] (Lv3)
  └─> [旋风斩] (Lv7)
        └─> [破甲斩] (Lv10)

[格挡] (Lv3)
  └─> [护体] (Lv7)
        └─> [不屈意志] (Lv10)
```

#### 法师技能树
```
[火球术] (Lv1)
  └─> [火雨] (Lv5)
        └─> [爆炎术] (Lv10)

[冰霜术] (Lv3)
  └─> [极寒术] (Lv7)
        └─> [冰冻风暴] (Lv10)

[魔法盾] (Lv5)
  └─> [元素护盾] (Lv10)
        └─> [奥术护盾] (Lv10)
```

#### 盗贼技能树
```
[背刺] (Lv3)
  └─> [暗影步] (Lv5)
        └─> [幻影斩] (Lv10)

[潜行] (Lv1)
  └─> [影分身] (Lv5)
        └─> [消失] (Lv10)

[开锁] (Lv3)
  └─> [陷阱拆除] (Lv7)
        └─> [暗影迷彩] (Lv10)

[双持] (Lv5)
  └─> [双持攻击] (Lv10)
  └─> [终极暗影] (Lv10)
```

---

## 八、经验与升级

### 8.1 升级系统

```
总经验 = 角色经验 + 地城经验
升 1 级 = 100 经验
属性成长 = 每级 +3 点自由属性点

每次升级：
- HP 上限 + 5
- 获得 1 点技能点
- 所有 HP 恢复
- 属性点：可以自由分配
```

### 8.2 经验获取

```
完成 Todo：
- 基础经验 = 10 (简单) / 20 (普通) / 35 (困难)
- 属性经验 = 基础经验 × (选中属性数)

地城探索：
- 平静探索：+5 经验
- 战斗胜利：+怪物种类经验
- 开启宝箱：+15 经验
- 事件奖励：+10-30 经验
```

---

## 九、UI 设计

### 9.1 界面层级

```
主界面
├─ 角色信息（HP、属性、装备）
├─ 任务列表
├─ 地城探索
├─ 装备/商店
└─ 设置
```

### 9.2 视觉元素

```
属性条：HP（红）、MP（蓝）、经验条（紫色）
装备槽：6 个框，显示装备图标
战斗日志：滚动文字，不同颜色表示不同类型
地城地图：7 个选项，每个有独特的颜色和图标
```

---

## 十、实现优先级

### P0 - 核心功能 (已完成)
- ✅ 用户注册/登录
- ✅ 角色创建
- ✅ 属性系统（6 大属性）
- ✅ 任务系统（难度、属性经验）
- ✅ 7 个地城
- ✅ 文字战斗系统
- ✅ 装备系统（7 个槽位、品质）
- ✅ 体力系统

### P1 - 增强功能 (下版本)
- ⚔️ 职业系统（5 种职业、技能树）
- 🗺️ 技能冷却系统
- 💪 装备强化（合成、升级）
- 📊 背包系统（多格、分类）
- 🏆 公会系统（创建、任务）
- 💎 Boss 战斗机制（多阶段）
- 📱 地图系统（探索进度）
- 🎯 成就系统（徽章、称号）
- 🌍 社交系统（好友、聊天）
- 📊 排行榜系统（金币、杀怪数）

### P2 - 优化功能 (未来)
- ⚡ WebSocket 实时战斗
- 📱 聚天数据库
- 🔐 自动战斗（自动探索）
- 🎲 PVP 竞技场
- 📱 全球排行榜
- 💰 存档系统（多槽位）
- 📱 云同步

### P3 - 创新功能 (长期)
- 🌍 世界事件（随机节日地城）
- 🎭 公会战（公会战）
- 🏰 坐系统（建造自己的地城）
- 🎨 宠物系统（宠物、坐骑）
- 📱 交易系统（玩家间交易）

---

## 十一、数据模型

### 11.1 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE characters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  class_id INT DEFAULT 1,
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  hp INT DEFAULT 10,
  max_hp INT DEFAULT 10,
  mp INT DEFAULT 10,
  max_mp INT DEFAULT 10,
  gold INT DEFAULT 0,
  stamina INT DEFAULT 10,
  max_stamina INT DEFAULT 10,
  skill_points INT DEFAULT 0,
  str INT DEFAULT 10,
  dex INT DEFAULT 10,
  con INT DEFAULT 10,
  int_score INT DEFAULT 10,
  wis INT DEFAULT 10,
  cha INT DEFAULT 10,
  str_exp INT DEFAULT 0,
  dex_exp INT DEFAULT 0,
  con_exp INT DEFAULT 0,
  int_exp INT DEFAULT 0,
  wis_exp INT DEFAULT 0,
  cha_exp INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE todos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(10) DEFAULT 'normal',
  str_exp INT DEFAULT 0,
  dex_exp INT DEFAULT 0,
  con_exp INT DEFAULT 0,
  int_exp INT DEFAULT 0,
  wis_exp INT DEFAULT 0,
  cha_exp INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 装备表
CREATE TABLE equipment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  base_strength INT DEFAULT 0,
  base_dexterity INT DEFAULT 0,
  base_constitution INT DEFAULT 0,
  base_intelligence INT DEFAULT 0,
  base_wisdom INT DEFAULT 0,
  base_charisma INT DEFAULT 0,
  bonus_strength INT DEFAULT 0,
  bonus_dexterity INT DEFAULT 0,
  bonus_constitution INT DEFAULT 0,
  bonus_intelligence INT DEFAULT 0,
  bonus_wisdom INT DEFAULT 0,
  bonus_charisma INT DEFAULT 0,
  level INT DEFAULT 1,
  slot_id INT DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 装备槽位表
CREATE TABLE equipment_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  slot_1_weapon BOOLEAN DEFAULT FALSE,
  slot_1_accessory BOOLEAN DEFAULT FALSE,
  slot_1_ring BOOLEAN DEFAULT FALSE,
  slot_1_helmet BOOLEAN DEFAULT FALSE,
  slot_1_armor BOOLEAN DEFAULT FALSE,
  slot_1_boots BOOLEAN DEFAULT FALSE,
  slot_2_weapon BOOLEAN DEFAULT FALSE,
  slot_2_accessory BOOLEAN DEFAULT FALSE,
  slot_2_ring BOOLEAN DEFAULT FALSE,
  slot_2_helmet BOOLEAN DEFAULT FALSE,
  slot_2_armor BOOLEAN DEFAULT FALSE,
  slot_2_boots BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技能表
CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  skill_id INT NOT NULL,
  level INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 地城表
CREATE TABLE dungeons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  level INT NOT NULL,
  stamina_cost INT NOT NULL,
  floors INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 地城配置表
CREATE TABLE dungeon_config (
  dungeon_id INT PRIMARY KEY AUTO_INCREMENT,
  monsters TEXT,
  events TEXT,
  boss_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 战斗记录
CREATE TABLE combat_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  dungeon_id INT,
  turn_number INT,
  action_type VARCHAR(50),
  target_id INT,
  result TEXT,
  damage INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 十二、战斗详细设计

### 12.1 战斗回合流程

```
1. 命中判定
   - 玩家投掷 D20
   - 修正：武器修正 + 属性
   - 检查：命中 = 50 + D20 >= 怪物 AC

2. 暴击判定
   - 玩家投掷 D20
   - 修正：武器修正 + 敏捷（如果暴击技能） + 感知（如被动技能）
   - 检查：暴击 = 20 或 (感知 >= 15 AND 随机)
   - 暴击效果：伤害 × 2

3. 闪避判定
   - 敌人投掷 D20
   - 修正：敏捷 + 护甲 + 地城环境
   - 检查：闪避 = 50 + D20 >= 50 + D20 + 敌人攻击
   - 闪避效果：免受本次伤害 + 下回合闪避率 +30%

4. 反击判定
   - 敌人投掷 D20
   - 修正：敏捷 + 武器类型（如果是重型武器则降低）
   - 检查：反击 = 50 + D20 + (敏捷 - 敌人敏捷)
   - 反击伤害 = 基础伤害 × 0.5（如果是双持职业则 × 0.75）
```

### 12.2 怪物 AI

```
怪物类型：野兽
  - 主动攻击概率：70%
  - 追击概率：80%（HP < 50%）
  - 逃跑概率：10%
  
怪物类型：亡灵
  - 主动攻击概率：80%
  - 技能使用概率：30%（生命吸取、恐惧）
  - 免疫状态：50%（骷髅）
  
怪物类型：恶魔
  - 主动攻击概率：90%
  - 技能使用概率：60%（混乱、暗影箭）
  - 召唤概率：20%（召唤小恶魔）
  
怪物类型：龙
  - 主动攻击概率：100%（每回合必定攻击）
  - 技能使用概率：50%（龙息、召唤）
  - 特殊：低血时狂暴（伤害 × 1.5）
```

---

## 十三、经济平衡

### 13.1 金币产出

```
来源：
- 完成任务：平均 15 金币/次
- 击败怪物：平均 8 金币/次
- 出售装备：获得原价 50-90%
- 商店购买：消耗金币
- 地城宝箱：平均 30-50 金币/次

金币消耗：
- 进入地城：每次 2-15 体力/层
- 使用技能：每次 5-30 MP
- 购买药水：100 金币（恢复 50 体力）
- 购买装备：200-500 金币
- 复活：200 金币
- 创建公会：5000 金币
```

### 13.2 装备价值模型

```
价值 = 基础价格 × 品质系数
品质系数：普通=1, 优秀=1.5, 稀有=2.5, 史诗=4, 传说=6

出售价格 = 价值 × 0.5
合成价格 = 价值 × 0.8

装备升级消耗：
- 普通→优秀：价值 × 0.5 + 50 金币
- 优秀→稀有：价值 × 0.5 + 100 金币
- 稀有→史诗：价值 × 0.5 + 200 金币
- 史诗→传说：价值 × 0.5 + 500 金币
```

---

## 十四、进度系统

### 14.1 解锁条件

```
地城解锁：
- 地城 1：无需解锁
- 地城 2：角色等级 3
- 地城 3：角色等级 5
- 地城 4：角色等级 7
- 地城 5：角色等级 9
- 地城 6：角色等级 11
- 地城 7：角色等级 13
- 地城 8：角色等级 15

Boss 解锁：
- 地城 1：完成第 1 层后
- 地城 2：完成第 2 层后
- 地城 3：完成第 3 层后
- 地城 4：完成第 4 层后
- 地城 5：完成第 5 层后
- 地城 6：完成第 6 层后
- 地城 7：完成第 7 层后
- 地城 8：完成第 8 层后
```

### 14.2 成就系统

```
首次成就：
- 创建角色
- 完成第一个任务
- 完成第一个地城

地城成就：
- 通关地城 1：新手冒险者
- 通关地城 2：资深探险者
- 通关地城 3：地下征服者
- 通关地城 4：传奇英雄
- 通关地城 5：深渊行者
- 通关地城 6：恶魔杀手
- 通关地城 7：龙王挑战者
- 通关地城 8：深渊之主

战斗成就：
- 第一次暴击
- 累计暴击 100 次
- 不受伤通关 5 层
- 单次战斗获得 100+ 经验

收集成就：
- 获得第 1 件传说装备
- 获得 5 件传说装备
- 获得 10 件史诗装备
- 累计获得 10000 金币

社交成就：
- 添加 10 个好友
- 添加 1 个公会
- 完成 100 个公会任务
- 在排行榜上第 1 名
```

---

## 十五、技术架构

### 15.1 后端架构

```
Node.js + Express
- RESTful API
- MySQL 2.0 数据库
- WebSocket 支持（未来）
- Redis 缓存（排行榜）
```

### 15.2 前端架构

```
HTML + CSS + Vanilla JavaScript
- 单页面应用
- 响应式设计
- 无框架依赖
- 快速加载

移动端（未来）：
- React Native
- PWA 支持
- 原生 App
```

### 15.3 部署方案

```
开发环境：本地测试
生产环境：Vercel / AWS
```

---

**最后更新：** 2026-02-25 v1.1
