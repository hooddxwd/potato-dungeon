# 土豆地城 (Potato Dungeon) - 规格文档

## 1. 项目概述

**项目名称**：土豆地城
**类型**：游戏化 Todo 管理 + 地城冒险网页应用
**核心概念**：结合 Habitica + World of Dungeons，通过完成 Todo 提升属性，进入地城冒险获得装备和金币
**技术栈**：前端 HTML/CSS/JS + 后端 Node.js/Express + 数据库 MySQL

---

## 2. 已完成功能

### 2.1 用户系统
- [x] 用户注册（用户名 + 密码）
- [x] 用户登录
- [x] 自动创建角色

### 2.2 属性系统 (DND 6大属性)
- [x] 力量 STR - 影响物理攻击
- [x] 敏捷 DEX - 影响闪避和远程攻击
- [x] 体质 CON - 影响 HP 上限
- [x] 智力 INT - 影响魔法攻击
- [x] 感知 WIS - 影响陷阱检定
- [x] 魅力 CHA - 影响掉落和奖励

### 2.3 任务系统 (Todo)
- [x] 创建 Todo
- [x] 选择 1-3 个属性加成
- [x] 难度选择（简单/普通/困难）
- [x] 完成 Todo 获得属性经验
- [ ] 属性经验积累后升级（待开发）
- [x] 升级系统（每100经验升1级）
- [x] 升级获得 HP 上限提升
- [x] 完成 Todo 恢复体力

### 2.4 地城系统
- [x] 3个地城（土豆洞穴、哥布林营地、废弃矿洞）
- [x] 推荐等级限制
- [x] 怪物战斗（D20 投骰 + 属性调整）
- [x] 随机事件（宝箱、陷阱、治疗）
- [x] 获得金币和经验
- [x] 冒险结果展示

### 2.5 装备系统
- [x] 装备掉落（怪物 30% 掉落几率）
- [x] 装备属性加成
- [x] 装备穿戴/卸下
- [x] 装备稀有度（普通、优秀、稀有、史诗、传说）
- [x] 装备出售获得金币

### 2.6 体力系统
- [x] 体力上限（等于体质属性）
- [x] 冒险消耗体力
- [x] 体力不足无法冒险
- [x] 每日体力恢复（凌晨4点）
- [x] 完成 Todo 恢复体力

### 2.7 商店系统
- [x] 购买体力药水
- [x] 购买装备
- [x] 金币不足提示

---

## 3. 开发中的功能

（暂无）

---

## 4. 待实现功能

### 4.1 地城扩展
- [ ] 更多地城（地精堡垒、巨龙巢穴、地下城深处等）
- [ ] 地城Boss战
- [ ] 地城进度/解锁系统

### 4.2 社交系统
- [ ] 排行榜
- [ ] 玩家资料查看

### 4.3 定时冒险
- [ ] 定时自动进入地城
- [ ] 后台冒险模式

### 4.4 背包系统
- [ ] 消耗品（药水）
- [ ] 背包 UI

### 4.5 冒险日志
- [ ] 历史冒险记录
- [ ] 统计信息

### 4.6 UI/UX 改进
- [ ] 更好的视觉效果
- [ ] 移动端适配
- [ ] 动画效果

---

## 5. 数据模型

### 5.1 users 表
```sql
users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 5.2 characters 表
```sql
characters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  exp INT DEFAULT 0,
  hp INT DEFAULT 10,
  max_hp INT DEFAULT 10,
  gold INT DEFAULT 0,
  stamina INT DEFAULT 10,
  max_stamina INT DEFAULT 10,
  last_staminaRecover DATETIME DEFAULT CURRENT_TIMESTAMP,
  str INT DEFAULT 10,
  dex INT DEFAULT 10,
  con INT DEFAULT 10,
  int_score INT DEFAULT 10,
  wis INT DEFAULT 10,
  cha INT DEFAULT 10,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 5.3 todos 表
```sql
todos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  str_exp INT DEFAULT 0,
  dex_exp INT DEFAULT 0,
  con_exp INT DEFAULT 0,
  int_exp INT DEFAULT 0,
  wis_exp INT DEFAULT 0,
  cha_exp INT DEFAULT 0,
  completed INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
)
```

### 5.4 equipment 表
```sql
equipment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  bonus_str INT DEFAULT 0,
  bonus_dex INT DEFAULT 0,
  bonus_con INT DEFAULT 0,
  bonus_int INT DEFAULT 0,
  bonus_wis INT DEFAULT 0,
  bonus_cha INT DEFAULT 0,
  equipped INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 5.5 shop_items 表
```sql
shop_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  price INT DEFAULT 0,
  bonus_str INT DEFAULT 0,
  bonus_dex INT DEFAULT 0,
  bonus_con INT DEFAULT 0,
  bonus_int INT DEFAULT 0,
  bonus_wis INT DEFAULT 0,
  bonus_cha INT DEFAULT 0,
  description VARCHAR(255)
)
```

### 5.6 adventures 表
```sql
adventures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  character_id INT NOT NULL,
  dungeon_level INT NOT NULL,
  result VARCHAR(50),
  gold_earned INT DEFAULT 0,
  exp_earned INT DEFAULT 0,
  equipment_earned TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## 6. API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 角色
- `GET /api/character/:id` - 获取角色信息

### Todo
- `GET /api/todos/:characterId` - 获取Todo列表
- `POST /api/todos` - 创建Todo
- `POST /api/todos/:id/complete` - 完成Todo
- `DELETE /api/todos/:id` - 删除Todo

### 地城
- `GET /api/dungeons` - 获取地城列表
- `POST /api/dungeons` - 开始冒险

### 装备
- `GET /api/equipment/:characterId` - 获取装备列表
- `POST /api/equipment/:id/equip` - 穿戴装备
- `DELETE /api/equipment/:id` - 出售装备

### 商店
- `GET /api/shop` - 获取商店物品列表
- `POST /api/shop/buy` - 购买物品

---

---

## 二、开发任务清单

### 阶段一：基础系统完善 ✅
- [x] 用户注册/登录
- [x] 属性系统（6大属性+经验）
- [x] 任务系统（难度选择、属性经验）
- [x] 地城系统（7个地城）
- [x] 装备系统（掉落、穿戴、出售）
- [x] 商店系统（药水、装备）
- [x] 体力系统
- [x] 升级机制
- [x] 文字战斗系统界面

---

### 阶段二：核心功能扩展
- [ ] 职业系统（5种职业、技能树）
- [ ] Boss 战斗机制（多阶段战斗、特殊技能）
- [ ] 地城层数扩展（每地城5-8层）
- [ ] 背包系统（多格、分类、堆叠）
- [ ] 装备强化系统（合成、升级）
- [ ] 地图系统（探索进度可视化）

---

### 阶段三：社交与社区
- [ ] 好友系统（添加、查看）
- [ ] 公会系统（创建、加入、任务）
- [ ] 排行榜（金币、击杀数、通关率）
- [ ] 聊天/世界事件（限时地城、Boss战）
- [ ] 师用系统（自定义头像、称号）

---

### 阶段四：高级玩法
- [ ] PVP 战场（1v1 战斗、排行榜）
- [ ] 实时组队副本（2-4人组队）
- [ ] 公会战（公会间对抗）
- [ ] 领地系统（购买领地、建城）
- [ ] 宠物系统（跟随战斗、收集）

---

### 阶段五：移动端
- [ ] 原生 App（iOS/Android）
- [ ] 响应式设计优化
- [ ] 手势支持
- [ ] 离线模式（部分功能可用）
- [ ] 推送通知

---

## 二、开发任务详解

### 职业系统
- [ ] 创建 professions 表（职业ID、名称、核心属性、技能树）
- [ ] 修改 characters 表添加 class_id 字段
- [ ] 创建 skills 表（技能ID、类型、效果、冷却、MP消耗）
- [ ] 升级时给予技能点
- [ ] 实现技能使用（MP消耗、冷却时间）
- [ ] 被动技能（盾牌格挡、狂暴、治疗术）

### Boss 战斗系统
- [ ] Boss 多阶段战斗（3-5个阶段）
- [ ] 阶段 1：普通攻击
- [ ] 阶段 2：使用特殊技能
- [ ] 阶段 3：狂暴模式（伤害翻倍）
- [ ] 击败奖励阶段奖励
- [ ] 特殊事件触发机制

### 地城层级扩展
- [ ] 将每个地城扩展为 5-8 层
- [ ] 每层 3-8 个房间（战斗、宝箱、事件）
- [ ] 层间传送门
- [ ] 隐藏房间（感知检定发现）
- [ ] 楼梯（特殊进入方式）
- [ ] Boss 房间（特殊设计）

### 背包系统
- [ ] 创建 inventory 表替代 equipment 表
- [ ] 添加 item_types 表（物品类型、堆叠限制）
- [ ] 实现道具系统（药水、卷轴、食物）
- [ ] 物品效果系统（持续时间、数量）
- [ ] 拖拽排序功能
- [ ] 快捷使用栏

### 装备强化
- [ ] 创建 equipment_upgrades 表
- [ ] 装备等级 1-10
- [ ] 强化材料需求（金币+基础装备）
- [ ] 属性成长系统（强化等级影响属性加成）
- [ ] 套运机制（成功率随等级降低）

### 地图系统
- [ ] 保存探索进度
- [ ] 可视化已探索区域
- [ ] 地图事件标记（宝箱、陷阱、商人）
- [ ] 地图收藏系统（购买/收藏）
- [ ] 快速旅行（已解锁地城间快速跳转）

### 公会系统
- [ ] 创建 guilds 表
- [ ] 公会任务（累计击杀数）
- [ ] 公会技能（公会专属技能）
- [ ] 公会商店（特殊折扣）
- [ ] 公会贡献度系统

---

## 二、时间规划

### 短期（1-2周）
**重点任务：**
- 职业系统（最高优先级 P0）
- Boss 战斗机制（P1）
- 地图结构优化（P2）
- 背包系统（P1）

---

### 中期（3-4周）
**重点任务：**
- 装备强化系统（P1）
- 地图系统（P2）
- 物品效果系统（P2）
- 世界事件系统（P1）

---

### 长期（1-2个月）
**重点任务：**
- PVP 战场（P2）
- 公会系统（P2）
- 实时组队（P2）
- 领地系统（P3）

---

## 三、技术债务

需要学习的技术：
- WebSocket 实时战斗
- 缓存策略（排行榜、地城数据）
- 数据库索引优化
- 图片 CDN

---

*最后更新：2026-02-25*
