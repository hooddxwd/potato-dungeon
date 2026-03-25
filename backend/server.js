const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 10001;
const WS_PORT = 10003;

app.use(cors());
app.use(express.json());

// 数据库配置 - 使用专用用户
const pool = mysql.createPool({
  host: 'localhost',
  user: 'potato_user',           // 使用专用用户
  password: 'potato_password_123', // 数据库密码
  database: 'potato_dungeon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 备用配置：如果使用 root 用户，请取消注释并填入密码
// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'YOUR_ROOT_PASSWORD_HERE', // 在这里填入你的 root 密码
//   database: 'potato_dungeon',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS characters (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, name VARCHAR(50) NOT NULL, level INT DEFAULT 1, exp INT DEFAULT 0, hp INT DEFAULT 30, max_hp INT DEFAULT 30, gold INT DEFAULT 0, stamina INT DEFAULT 10, max_stamina INT DEFAULT 10, last_stamina_recover DATETIME DEFAULT CURRENT_TIMESTAMP, str INT DEFAULT 10, dex INT DEFAULT 10, con INT DEFAULT 10, int_score INT DEFAULT 10, wis INT DEFAULT 10, cha INT DEFAULT 10, str_exp INT DEFAULT 0, dex_exp INT DEFAULT 0, con_exp INT DEFAULT 0, int_exp INT DEFAULT 0, wis_exp INT DEFAULT 0, cha_exp INT DEFAULT 0, profession_id INT DEFAULT NULL, mp INT DEFAULT 20, max_mp INT DEFAULT 20, skill_points INT DEFAULT 0, battle_style VARCHAR(20) DEFAULT 'balanced', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS equipment (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, name VARCHAR(100) NOT NULL, type VARCHAR(50) NOT NULL, rarity VARCHAR(20) DEFAULT 'common', bonus_str INT DEFAULT 0, bonus_dex INT DEFAULT 0, bonus_con INT DEFAULT 0, bonus_int INT DEFAULT 0, bonus_wis INT DEFAULT 0, bonus_cha INT DEFAULT 0, equipped INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (character_id) REFERENCES characters(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS todos (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, title VARCHAR(200) NOT NULL, description TEXT, difficulty VARCHAR(10) DEFAULT 'normal', str_exp INT DEFAULT 0, dex_exp INT DEFAULT 0, con_exp INT DEFAULT 0, int_exp INT DEFAULT 0, wis_exp INT DEFAULT 0, cha_exp INT DEFAULT 0, completed INT DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME, FOREIGN KEY (character_id) REFERENCES characters(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS adventures (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, dungeon_level INT NOT NULL, result VARCHAR(50), gold_earned INT DEFAULT 0, exp_earned INT DEFAULT 0, equipment_earned TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (character_id) REFERENCES characters(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS dungeon_runs (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, dungeon_level INT NOT NULL, current_floor INT DEFAULT 1, current_room INT DEFAULT 0, floors JSON NOT NULL, player_hp INT NOT NULL, player_mp INT NOT NULL, in_battle BOOLEAN DEFAULT FALSE, current_battle JSON NOT NULL, party_dungeon_id VARCHAR(100), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (character_id) REFERENCES characters(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS battle_states (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, monster_id VARCHAR(50) NOT NULL, turn INT DEFAULT 1, player_hp INT NOT NULL, player_mp INT NOT NULL, monster_hp INT NOT NULL, player_cooldowns JSON NOT NULL, monster_cooldowns JSON NOT NULL, status_effects JSON NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (character_id) REFERENCES characters(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS professions (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL UNIQUE, display_name VARCHAR(50) NOT NULL, description TEXT, base_stats JSON NOT NULL, skills JSON NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    await connection.query(`CREATE TABLE IF NOT EXISTS skills (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL, display_name VARCHAR(50) NOT NULL, profession_id INT, type ENUM('passive','active') NOT NULL, description TEXT, mp_cost INT DEFAULT 0, cooldown INT DEFAULT 0, effect_data JSON NOT NULL, unlock_level INT DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (profession_id) REFERENCES professions(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS player_skills (id INT PRIMARY KEY AUTO_INCREMENT, character_id INT NOT NULL, skill_id INT NOT NULL, level INT DEFAULT 1, mastered BOOLEAN DEFAULT FALSE, learned_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (character_id) REFERENCES characters(id), FOREIGN KEY (skill_id) REFERENCES skills(id))`);

    // 插入初始职业数据
    const [professions] = await connection.query('SELECT COUNT(*) as count FROM professions');
    if (professions[0].count === 0) {
      await connection.query(`INSERT INTO professions (name, display_name, description, base_stats, skills) VALUES
        ('warrior', '战士', '擅长近战，高血量和攻击力', '{"str":2,"con":1,"dex":0,"int":0,"wis":0,"cha":0}', '{"passive":["盾牌格挡","坚韧"], "active":["冲锋","战吼"]}'),
        ('mage', '法师', '擅长魔法攻击，高智力', '{"str":0,"con":0,"dex":0,"int":2,"wis":1,"cha":0}', '{"passive":["魔法抗性","法力涌动"], "active":["火球术","冰霜术"]}'),
        ('rogue', '盗贼', '擅长暴击和闪避，高敏捷', '{"str":1,"dex":2,"con":0,"int":0,"wis":0,"cha":1}', '{"passive":["暴击大师","潜行大师"], "active":["背刺","潜行"]}'),
        ('paladin', '圣骑士', '擅长防御和治疗，全面发展', '{"str":1,"con":1,"dex":0,"int":0,"wis":1,"cha":1}', '{"passive":["神圣光环","不屈"], "active":["圣光术","护盾"]}'),
        ('cleric', '牧师', '擅长治疗和辅助，高感知', '{"str":0,"con":1,"dex":0,"int":0,"wis":2,"cha":1}', '{"passive":["净化光环","虔诚"], "active":["治疗术","净化术"]}')`);
      console.log('Professions initialized');
    }

    // 插入初始技能数据
    const [skills] = await connection.query('SELECT COUNT(*) as count FROM skills');
    if (skills[0].count === 0) {
      await connection.query(`INSERT INTO skills (name, display_name, profession_id, type, description, mp_cost, cooldown, effect_data, unlock_level) VALUES
        -- 战士技能
        ('shield_block', '盾牌格挡', 1, 'passive', '每次受到的伤害减少20%', 0, 0, '{"damage_reduction": 0.2}', 1),
        ('toughness', '坚韧', 1, 'passive', '最大HP增加10%', 0, 0, '{"hp_bonus_percent": 0.1}', 1),
        ('charge', '冲锋', 1, 'active', '冲向敌人造成额外伤害', 5, 3, '{"damage_bonus": 5}', 3),
        ('war_cry', '战吼', 1, 'active', '提升下一回合的伤害', 8, 5, '{"damage_boost": 1.5, "duration": 1}', 5),

        -- 法师技能
        ('magic_resistance', '魔法抗性', 2, 'passive', '受到的魔法伤害减少15%', 0, 0, '{"magic_damage_reduction": 0.15}', 1),
        ('mana_surge', '法力涌动', 2, 'passive', '每回合恢复1点MP', 0, 0, '{"mp_regen_per_turn": 1}', 1),
        ('fireball', '火球术', 2, 'active', '发射火球造成火焰伤害', 12, 3, '{"damage": 15, "element": "fire"}', 3),
        ('frost_bolt', '冰霜术', 2, 'active', '发射冰锥造成冰冻伤害', 10, 3, '{"damage": 12, "element": "ice", "slow_chance": 0.2}', 3),

        -- 盗贼技能
        ('crit_master', '暴击大师', 3, 'passive', '暴击几率增加10%', 0, 0, '{"crit_bonus": 0.1}', 1),
        ('stealth_master', '潜行大师', 3, 'passive', '闪避几率增加10%', 0, 0, '{"dodge_bonus": 0.1}', 1),
        ('backstab', '背刺', 3, 'active', '从背后攻击造成巨额伤害', 8, 4, '{"damage_multiplier": 2.5}', 3),
        ('stealth', '潜行', 3, 'active', '进入潜行状态，增加闪避和暴击', 5, 5, '{"dodge_bonus": 0.3, "crit_bonus": 0.2, "duration": 2}', 3),

        -- 圣骑士技能
        ('holy_aura', '神圣光环', 4, 'passive', '每回合恢复5%HP', 0, 0, '{"hp_regen_percent": 0.05}', 1),
        ('unyielding', '不屈', 4, 'passive', 'HP低于30%时防御力提高20%', 0, 0, '{"defense_boost_low_hp": 0.2}', 1),
        ('holy_light', '圣光术', 4, 'active', '治疗自身HP', 10, 4, '{"heal": 20}', 3),
        ('shield', '护盾', 4, 'active', '创造一个护盾吸收伤害', 8, 5, '{"shield_amount": 15}', 3),

        -- 牧师技能
        ('purify_aura', '净化光环', 5, 'passive', '异常状态持续时间减少50%', 0, 0, '{"debuff_reduction": 0.5}', 1),
        ('devotion', '虔诚', 5, 'passive', '治疗效果提高20%', 0, 0, '{"heal_bonus": 0.2}', 1),
        ('heal', '治疗术', 5, 'active', '治疗目标', 12, 3, '{"heal": 25}', 3),
        ('purify', '净化术', 5, 'active', '移除异常状态', 8, 4, '{"remove_debuffs": true}', 5)`);
      console.log('Skills initialized');
    }
    
    // 好友系统
    await connection.query(`CREATE TABLE IF NOT EXISTS friendships (id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL, friend_id INT NOT NULL, status ENUM('pending','accepted') DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (friend_id) REFERENCES users(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS parties (id INT PRIMARY KEY AUTO_INCREMENT, leader_id INT NOT NULL, name VARCHAR(100) NOT NULL, max_members INT DEFAULT 4, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (leader_id) REFERENCES users(id))`);
    await connection.query(`CREATE TABLE IF NOT EXISTS party_members (id INT PRIMARY KEY AUTO_INCREMENT, party_id INT NOT NULL, user_id INT NOT NULL, character_id INT NOT NULL, joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (party_id) REFERENCES parties(id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (character_id) REFERENCES characters(id))`);
    
    console.log('Database initialized');
  } finally { connection.release(); }
}

// ==================== 地城系统 ====================
const MONSTERS = {
  slime: { name: "Slime", hp: 5, ac: 6, atk: 2, exp: 8, gold: 5, type: "beast" },
  goblin: { name: "Goblin", hp: 8, ac: 10, atk: 3, exp: 10, gold: 8, type: "humanoid" },
  skeleton: { name: "Skeleton", hp: 10, ac: 12, atk: 4, exp: 15, gold: 10, type: "undead" },
  zombie: { name: "Zombie", hp: 15, ac: 8, atk: 5, exp: 18, gold: 12, type: "undead" },
  wolf: { name: "Wolf", hp: 12, ac: 12, atk: 5, exp: 12, gold: 8, type: "beast" },
  orc: { name: "Orc", hp: 20, ac: 14, atk: 7, exp: 25, gold: 20, type: "humanoid" },
  golem: { name: "Golem", hp: 35, ac: 16, atk: 10, exp: 40, gold: 30, type: "construct" },
  dragon: { name: "Dragon", hp: 50, ac: 18, atk: 14, exp: 80, gold: 80, type: "dragon" },
  demon: { name: "Demon", hp: 45, ac: 18, atk: 16, exp: 90, gold: 75, type: "fiend" }
};

const DUNGEONS = {
  1: { name: "Potato Cave", recommendedLevel: 1, staminaCost: 2, monsters: ["slime", "slime"], events: [{type:"treasure",gold:15,exp:10},{type:"trap",damage:2},{type:"heal",heal:10}] },
  2: { name: "Goblin Camp", recommendedLevel: 3, staminaCost: 3, monsters: ["goblin","goblin","wolf"], events: [{type:"treasure",gold:30,exp:20},{type:"trap",damage:5},{type:"heal",heal:15}] },
  3: { name: "Crypt", recommendedLevel: 5, staminaCost: 4, monsters: ["skeleton","zombie","skeleton"], events: [{type:"treasure",gold:50,exp:30},{type:"trap",damage:12},{type:"heal",heal:25}] },
  4: { name: "Orc Fortress", recommendedLevel: 7, staminaCost: 5, monsters: ["orc","orc","wolf"], events: [{type:"treasure",gold:80,exp:40},{type:"trap",damage:15},{type:"heal",heal:30}] },
  5: { name: "Golem Factory", recommendedLevel: 9, staminaCost: 6, monsters: ["golem","golem","slime"], events: [{type:"treasure",gold:100,exp:50},{type:"trap",damage:20},{type:"heal",heal:40}] },
  6: { name: "Dragon Lair", recommendedLevel: 11, staminaCost: 8, monsters: ["dragon","dragon","golem"], events: [{type:"treasure",gold:200,exp:80},{type:"trap",damage:30},{type:"heal",heal:50}] },
  7: { name: "Demon Realm", recommendedLevel: 13, staminaCost: 10, monsters: ["demon","demon","dragon"], events: [{type:"treasure",gold:300,exp:100},{type:"trap",damage:40},{type:"heal",heal:60}] }
};

function getMod(score) { return Math.floor((score - 10) / 2); }
function abilityCheck(abilityScore, difficulty = 10) { const mod = getMod(abilityScore); const roll = Math.floor(Math.random() * 20) + 1; return roll + mod >= difficulty; }

// ==================== 自动战斗系统 ====================

/**
 * 自动战斗系统
 * @param {Object} character - 角色属性
 * @param {Object} monster - 怪物属性
 * @param {string} battleStyle - 战斗风格: 'aggressive'(激进), 'balanced'(平衡), 'defensive'(保守)
 * @returns {Object} 战斗结果
 */
function autoBattle(character, monster, battleStyle = 'balanced') {
  const logs = [];
  let playerHp = character.hp;
  const playerMaxHp = character.max_hp;
  let playerMp = character.mp;
  let monsterHp = monster.hp;
  const monsterMaxHp = monster.hp;

  // 计算玩家属性（含装备加成）
  const playerStr = character.str + (character.bonus_str || 0);
  const playerDex = character.dex + (character.bonus_dex || 0);
  const playerCon = character.con + (character.bonus_con || 0);
  const playerInt = character.int_score + (character.bonus_int || 0);
  const playerWis = character.wis + (character.bonus_wis || 0);

  // 战斗风格参数
  const styleParams = {
    aggressive: { attackBonus: 2, defensePenalty: 1, skillChance: 0.7, fleeThreshold: 0.1 },
    balanced: { attackBonus: 0, defensePenalty: 0, skillChance: 0.5, fleeThreshold: 0.2 },
    defensive: { attackBonus: -1, defenseBonus: 2, skillChance: 0.3, healChance: 0.4, fleeThreshold: 0.3 }
  };

  const style = styleParams[battleStyle] || styleParams.balanced;
  let turn = 1;
  const maxTurns = 50; // 防止无限循环

  while (playerHp > 0 && monsterHp > 0 && turn <= maxTurns) {
    logs.push(`\n=== 第 ${turn} 回合 ===`);

    // 检查是否应该逃跑
    const hpPercent = playerHp / playerMaxHp;
    if (hpPercent < style.fleeThreshold && Math.random() < 0.3) {
      const fleeRoll = Math.random();
      const fleeBonus = (playerDex - 10) / 20; // 敏捷影响逃跑成功率
      if (fleeRoll + fleeBonus > 0.5) {
        logs.push(`🏃 玩家尝试逃跑... 成功！`);
        return {
          result: 'flee',
          logs,
          remainingHp: playerHp,
          remainingMp: playerMp,
          turns: turn
        };
      } else {
        logs.push(`🏃 玩家尝试逃跑... 失败！`);
      }
    }

    // 玩家行动
    const playerAction = decidePlayerAction(character, monster, playerHp, playerMp, style, logs);
    const playerResult = executePlayerAction(
      playerAction,
      { str: playerStr, dex: playerDex, int: playerInt, wis: playerWis, con: playerCon },
      monster,
      playerHp,
      playerMp,
      style,
      logs
    );

    playerHp = playerResult.newHp;
    playerMp = playerResult.newMp;
    monsterHp = playerResult.monsterHp;

    if (monsterHp <= 0) {
      logs.push(`\n🎉 战斗胜利！击败了 ${monster.name}！`);
      break;
    }

    // 怪物行动
    const monsterDamage = calculateMonsterDamage(monster, character, style.defenseBonus || 0);
    playerHp -= monsterDamage;
    logs.push(`👹 ${monster.name} 攻击！造成 ${monsterDamage} 点伤害`);

    if (playerHp <= 0) {
      logs.push(`\n💀 战斗失败！被 ${monster.name} 击败...`);
      break;
    }

    turn++;
  }

  // 计算奖励
  if (playerHp > 0) {
    const expGain = monster.exp;
    const goldGain = monster.gold + Math.floor(Math.random() * 10);
    const critRoll = Math.random();
    const isCrit = critRoll < 0.05 + (playerWis >= 15 ? 0.05 : 0); // 感知影响暴击率

    return {
      result: 'victory',
      logs,
      remainingHp: Math.max(0, playerHp),
      remainingMp: Math.max(0, playerMp),
      turns: turn,
      rewards: {
        exp: isCrit ? Math.floor(expGain * 1.5) : expGain,
        gold: isCrit ? Math.floor(goldGain * 1.5) : goldGain,
        isCrit
      }
    };
  } else {
    return {
      result: 'defeat',
      logs,
      remainingHp: 0,
      remainingMp: Math.max(0, playerMp),
      turns: turn
    };
  }
}

/**
 * 决定玩家行动
 */
function decidePlayerAction(character, monster, playerHp, playerMp, style, logs) {
  const hpPercent = playerHp / character.max_hp;
  const mpPercent = playerMp / character.max_mp;

  // 保守风格：HP低时优先治疗
  if (style.healChance && hpPercent < 0.4 && mpPercent > 0.3) {
    if (Math.random() < style.healChance) {
      return 'heal';
    }
  }

  // 激进风格：优先使用技能
  if (style.skillChance > 0.5 && mpPercent > 0.2 && Math.random() < style.skillChance) {
    return 'skill';
  }

  // 平衡风格：根据MP情况决定
  if (mpPercent > 0.3 && Math.random() < 0.5) {
    return 'skill';
  }

  // 默认：普通攻击
  return 'attack';
}

/**
 * 执行玩家行动
 */
function executePlayerAction(action, playerStats, monster, playerHp, playerMp, style, logs) {
  let newHp = playerHp;
  let newMp = playerMp;
  let monsterHp = monster.hp;
  let damage = 0;

  switch (action) {
    case 'attack':
      // 物理攻击
      const strMod = getMod(playerStats.str);
      const roll = Math.floor(Math.random() * 20) + 1;
      const attackRoll = roll + strMod + (style.attackBonus || 0);
      const isCrit = roll === 20 || (roll >= 18 && playerStats.wis >= 15);

      damage = Math.max(1, strMod + 3 + (isCrit ? 5 : 0));
      damage += style.attackBonus || 0;

      monsterHp -= damage;
      logs.push(`⚔️ 玩家攻击！掷骰 ${roll}${roll === 20 ? ' (暴击!)' : ''}，造成 ${damage} 点伤害`);
      break;

    case 'skill':
      // 魔法技能（消耗MP）
      if (newMp >= 5) {
        const intMod = getMod(playerStats.int);
        const skillDamage = Math.max(3, intMod + 5 + Math.floor(Math.random() * 6));
        newMp -= 5;
        monsterHp -= skillDamage;
        logs.push(`✨ 玩家使用魔法！消耗 5 MP，造成 ${skillDamage} 点伤害`);
      } else {
        // MP不足，改为普通攻击
        const strMod = getMod(playerStats.str);
        damage = Math.max(1, strMod + 2);
        monsterHp -= damage;
        logs.push(`⚔️ MP不足！玩家普通攻击，造成 ${damage} 点伤害`);
      }
      break;

    case 'heal':
      // 治疗（消耗MP）
      if (newMp >= 8) {
        const wisMod = getMod(playerStats.wis);
        const healAmount = Math.max(5, wisMod + 10 + Math.floor(Math.random() * 6));
        newMp -= 8;
        newHp = Math.min(newHp + healAmount, 1000); // 假设最大HP上限
        logs.push(`💚 玩家使用治疗！消耗 8 MP，恢复 ${healAmount} HP`);
      } else {
        // MP不足，改为普通攻击
        const strMod = getMod(playerStats.str);
        damage = Math.max(1, strMod + 2);
        monsterHp -= damage;
        logs.push(`⚔️ MP不足！玩家普通攻击，造成 ${damage} 点伤害`);
      }
      break;

    case 'defend':
      // 防御姿态
      logs.push(`🛡️ 玩家采取防御姿态！下回合伤害减半`);
      break;
  }

  return { newHp, newMp, monsterHp };
}

/**
 * 计算怪物伤害
 */
function calculateMonsterDamage(monster, character, playerDefenseBonus = 0) {
  const baseDamage = Math.max(1, monster.atk - 3);
  const roll = Math.floor(Math.random() * 6) + 1;
  const conMod = getMod(character.con);
  const defenseBonus = playerDefenseBonus + conMod;

  let damage = Math.max(1, baseDamage + roll - defenseBonus);
  return damage;
}

const EQUIP_TEMPLATES = {
  weapon: [{name:"Iron Sword",rarity:"common",bonus_str:2},{name:"Steel Sword",rarity:"uncommon",bonus_str:3,bonus_dex:1},{name:"Magic Sword",rarity:"rare",bonus_str:4,bonus_int:2},{name:"Legendary Blade",rarity:"epic",bonus_str:6,bonus_dex:3}],
  armor: [{name:"Leather Armor",rarity:"common",bonus_con:2},{name:"Chain Mail",rarity:"uncommon",bonus_con:3},{name:"Plate Armor",rarity:"rare",bonus_con:4,bonus_str:2},{name:"Dragon Scale",rarity:"epic",bonus_con:6,bonus_wis:3}],
  accessory: [{name:"Ring",rarity:"common",bonus_cha:2},{name:"Amulet",rarity:"uncommon",bonus_wis:3},{name:"Magic Necklace",rarity:"rare",bonus_int:3,bonus_wis:2},{name:"Godly Artifact",rarity:"epic",bonus_cha:5,bonus_wis:4}]
};
const RARITY_CHANCE = {common:0.5,uncommon:0.3,rare:0.15,epic:0.05};

function generateEquipment(dlvl) {
  const type = ['weapon','armor','accessory'][Math.floor(Math.random()*3)];
  const roll = Math.random();
  let rar = roll < RARITY_CHANCE.epic && dlvl>=5 ? 'epic' : roll < RARITY_CHANCE.rare && dlvl>=3 ? 'rare' : roll < RARITY_CHANCE.uncommon ? 'uncommon' : 'common';
  const temps = EQUIP_TEMPLATES[type].filter(t => ['common','uncommon','rare','epic'].indexOf(t.rarity) <= ['common','uncommon','rare','epic'].indexOf(rar));
  const tpl = temps[Math.floor(Math.random()*temps.length)];
  const lvlBonus = Math.floor(dlvl/2);
  return {name:tpl.name,type,rarity:rar,bonus_str:(tpl.bonus_str||0)+lvlBonus,bonus_dex:(tpl.bonus_dex||0),bonus_con:(tpl.bonus_con||0),bonus_int:(tpl.bonus_int||0),bonus_wis:(tpl.bonus_wis||0),bonus_cha:(tpl.bonus_cha||0)};
}

// ==================== API ====================

// 获取职业列表
app.get('/api/professions', async (req,res)=>{
  try{
    const[profs]=await pool.execute('SELECT * FROM professions ORDER BY id');
    res.json({success:true,professions:profs});
  }catch(e){
    res.json({success:false,message:'Failed to load professions'});
  }
});

// ==================== 技能系统 ====================

// 获取角色可学习的技能
app.get('/api/skills/:characterId', async (req,res)=>{
  try{
    const[chars]=await pool.execute('SELECT * FROM characters WHERE id=?',[req.params.characterId]);
    if(chars.length===0)return res.json({success:false,message:'Character not found'});
    const ch=chars[0];

    // 获取角色已学习的技能
    const[learned]=await pool.execute('SELECT skill_id FROM player_skills WHERE character_id=?',[req.params.characterId]);
    const learnedIds=new Set(learned.map(s=>s.skill_id));

    // 获取角色职业可学习的技能
    const skillsQuery=ch.profession_id
      ? 'SELECT * FROM skills WHERE profession_id=? OR profession_id IS NULL ORDER BY unlock_level, id'
      : 'SELECT * FROM skills WHERE profession_id IS NULL ORDER BY unlock_level, id';
    const[skills]=await pool.execute(skillsQuery,ch.profession_id?[ch.profession_id]:[]);

    // 标记哪些已学习
    const result=skills.map(s=>({...s,learned:learnedIds.has(s.id),can_learn:s.unlock_level<=ch.level&&!learnedIds.has(s.id)}));

    res.json({success:true,skills:result,skill_points:ch.skill_points||0,level:ch.level});
  }catch(e){
    console.error('Skills error:', e);
    res.json({success:false,message:'Failed to load skills'});
  }
});

// 获取角色已学习的技能
app.get('/api/player-skills/:characterId', async (req,res)=>{
  try{
    const[skills]=await pool.execute(`
      SELECT ps.*, s.display_name, s.type, s.description, s.mp_cost, s.cooldown, s.effect_data
      FROM player_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.character_id = ?
      ORDER BY s.type DESC, ps.learned_at
    `,[req.params.characterId]);
    res.json({success:true,skills:skills});
  }catch(e){
    res.json({success:false,message:'Failed to load player skills'});
  }
});

// 学习技能
app.post('/api/skills/:characterId/learn', async (req,res)=>{
  const conn=await pool.getConnection();
  try{
    const{skillId}=req.body;
    if(!skillId)return res.json({success:false,message:'Skill ID required'});

    await conn.beginTransaction();

    // 获取角色信息
    const[chars]=await conn.execute('SELECT * FROM characters WHERE id=?',[req.params.characterId]);
    if(chars.length===0){await conn.rollback();return res.json({success:false,message:'Character not found'});}
    const ch=chars[0];

    // 检查技能点
    if((ch.skill_points||0)<=0){await conn.rollback();return res.json({success:false,message:'Not enough skill points'});}

    // 检查是否已学习
    const[existing]=await conn.execute('SELECT * FROM player_skills WHERE character_id=? AND skill_id=?',[req.params.characterId,skillId]);
    if(existing.length>0){await conn.rollback();return res.json({success:false,message:'Already learned'});}

    // 获取技能信息
    const[skills]=await conn.execute('SELECT * FROM skills WHERE id=?',[skillId]);
    if(skills.length===0){await conn.rollback();return res.json({success:false,message:'Skill not found'});}
    const skill=skills[0];

    // 检查职业和等级
    if(skill.profession_id && skill.profession_id!==ch.profession_id){
      await conn.rollback();
      return res.json({success:false,message:'Skill not available for your profession'});
    }
    if(skill.unlock_level>ch.level){
      await conn.rollback();
      return res.json({success:false,message:'Level too low (need Lv.'+skill.unlock_level+')'});
    }

    // 学习技能
    await conn.execute('INSERT INTO player_skills (character_id,skill_id) VALUES (?,?)',[req.params.characterId,skillId]);

    // 扣除技能点
    await conn.execute('UPDATE characters SET skill_points=skill_points-1 WHERE id=?',[req.params.characterId]);

    await conn.commit();

    res.json({success:true,message:'Learned '+skill.display_name,skill,remaining_skill_points:(ch.skill_points||0)-1});
  }catch(e){
    await conn.rollback();
    console.error('Learn skill error:', e);
    res.json({success:false,message:'Failed to learn skill'});
  }finally{
    conn.release();
  }
});

app.post('/api/auth/register', async (req,res)=>{try{const{username,password,professionId}=req.body;const[r]=await pool.execute('INSERT INTO users(username,password)VALUES(?,?)',[username,password]);let characterInsert = 'INSERT INTO characters(user_id,name)';
let characterValues = 'VALUES(?,?)';
let params = [r.insertId, username];

// 如果选择了职业，应用职业属性加成
if (professionId) {
  const [profs] = await pool.execute('SELECT * FROM professions WHERE id=?', [professionId]);
  if (profs.length > 0) {
    const prof = profs[0];
    // mysql2/promise 自动解析JSON字段，直接使用即可
    const baseStats = prof.base_stats;
    characterInsert = 'INSERT INTO characters(user_id,name,str,dex,con,int_score,wis,cha,profession_id)';
    characterValues = 'VALUES(?,?,?,?,?,?,?,?,?)';
    params = [
      r.insertId,
      username,
      10 + (baseStats.str || 0),
      10 + (baseStats.dex || 0),
      10 + (baseStats.con || 0),
      10 + (baseStats.int || 0),
      10 + (baseStats.wis || 0),
      10 + (baseStats.cha || 0),
      professionId
    ];
  }
}

const[cr]=await pool.execute(characterInsert + ' ' + characterValues, params);
res.json({success:true,userId:r.insertId,characterId:cr.insertId})}catch(e){console.error('Registration error:', e);res.json({success:false,message:e.code==='ER_DUP_ENTRY'?'Username exists':'Registration failed',error:e.message})}});

app.post('/api/auth/login', async (req,res)=>{try{const{username,password}=req.body;const[users]=await pool.execute('SELECT*FROM users WHERE username=? AND password=?',[username,password]);if(users.length===0)return res.json({success:false,message:'Invalid credentials'});const[chars]=await pool.execute('SELECT*FROM characters WHERE user_id=?',[users[0].id]);let character=chars[0]||null;
let profession=null;
if(character && character.profession_id){
  const[profs]=await pool.execute('SELECT*FROM professions WHERE id=?',[character.profession_id]);
  if(profs.length>0)profession=profs[0];
}
res.json({success:true,user:users[0],character,profession})}catch(e){console.error('Login error:', e);res.json({success:false,message:'Login failed'})}});

app.get('/api/character/:id', async (req,res)=>{try{const[chars]=await pool.execute('SELECT*FROM characters WHERE id=?',[req.params.id]);if(chars.length===0)return res.json({success:false});const ch=chars[0];
let profession=null;
if(ch.profession_id){
  const[profs]=await pool.execute('SELECT*FROM professions WHERE id=?',[ch.profession_id]);
  if(profs.length>0)profession=profs[0];
}
const[eq]=await pool.execute('SELECT*FROM equipment WHERE character_id=?',[req.params.id]);res.json({success:true,character:ch,profession, equipment:eq})}catch(e){res.json({success:false})}});

app.get('/api/todos/:characterId', async (req,res)=>{try{const[todos]=await pool.execute('SELECT*FROM todos WHERE character_id=? ORDER BY created_at DESC',[req.params.characterId]);res.json({success:true,todos})}catch(e){res.json({success:false})}});

app.post('/api/todos', async (req,res)=>{try{const{characterId,title,description,difficulty}=req.body;let{strExp,dexExp,conExp,intExp,wisExp,chaExp}=req.body;strExp=parseInt(strExp)||0;dexExp=parseInt(dexExp)||0;conExp=parseInt(conExp)||0;intExp=parseInt(intExp)||0;wisExp=parseInt(wisExp)||0;chaExp=parseInt(chaExp)||0;const baseExp={'easy':10,'normal':20,'hard':35}[difficulty]||20;const exp={str:strExp>0?baseExp:0,dex:dexExp>0?baseExp:0,con:conExp>0?baseExp:0,int:intExp>0?baseExp:0,wis:wisExp>0?baseExp:0,cha:chaExp>0?baseExp:0};if(!(strExp||dexExp||conExp||intExp||wisExp||chaExp))exp.str=baseExp;const[r]=await pool.execute('INSERT INTO todos(character_id,title,description,difficulty,str_exp,dex_exp,con_exp,int_exp,wis_exp,cha_exp)VALUES(?,?,?,?,?,?,?,?,?,?)',[characterId,title,description||'',difficulty||'normal',exp.str,exp.dex,exp.con,exp.int,exp.wis,exp.cha]);res.json({success:true,todoId:r.insertId})}catch(e){res.json({success:false})}});

app.post('/api/todos/:id/complete', async (req,res)=>{const conn=await pool.getConnection();try{const[todos]=await conn.execute('SELECT*FROM todos WHERE id=?',[req.params.id]);if(todos.length===0)return res.json({success:false,message:'Not found'});const todo=todos[0];if(todo.completed)return res.json({success:false,message:'Already completed'});await conn.beginTransaction();await conn.execute('UPDATE todos SET completed=1,completed_at=NOW()WHERE id=?',[req.params.id]);const[chars]=await conn.execute('SELECT*FROM characters WHERE id=?',[todo.character_id]);const ch=chars[0];const expGained={str:todo.str_exp||0,dex:todo.dex_exp||0,con:todo.con_exp||0,int:todo.int_exp||0,wis:todo.wis_exp||0,cha:todo.cha_exp||0};const totalExp=Object.values(expGained).reduce((a,b)=>a+b,0);let newExp=ch.exp+totalExp,newLevel=ch.level,hpGain=Math.floor(Math.random()*3)+1;while(newExp>=100){newExp-=100;newLevel++}const EXP_LVL=25;let sG=0,dG=0,cG=0,iG=0,wG=0,chG=0,sE=ch.str_exp+expGained.str,dE=ch.dex_exp+expGained.dex,cE=ch.con_exp+expGained.con,iE=ch.int_exp+expGained.int,wE=ch.wis_exp+expGained.wis,chE=ch.cha_exp+expGained.cha;while(sE>=EXP_LVL){sE-=EXP_LVL;sG++}while(dE>=EXP_LVL){dE-=EXP_LVL;dG++}while(cE>=EXP_LVL){cE-=EXP_LVL;cG++}while(iE>=EXP_LVL){iE-=EXP_LVL;iG++}while(wE>=EXP_LVL){wE-=EXP_LVL;wG++}while(chE>=EXP_LVL){chE-=EXP_LVL;chG++}await conn.execute('UPDATE characters SET exp=?,level=?,hp=LEAST(max_hp+?,hp+?),max_hp=max_hp+?,str=str+?,dex=dex+?,con=con+?,int_score=int_score+?,wis=wis+?,cha=cha+?,str_exp=?,dex_exp=?,con_exp=?,int_exp=?,wis_exp=?,cha_exp=?,skill_points=skill_points+? WHERE id=?',[newExp,newLevel,hpGain,hpGain,hpGain,sG,dG,cG,iG,wG,chG,sE,dE,cE,iE,wE,chE,newLevel-ch.level,ch.id]);const[upd]=await conn.execute('SELECT*FROM characters WHERE id=?',[ch.id]);await conn.commit();res.json({success:true,expGained,levelUp:newLevel>ch.level,newLevel,hpGained,attributeExpGained:expGained,attributeGained:{str:sG,dex:dG,con:cG,int:iG,wis:wG,cha:chG},skillPointGained:newLevel-ch.level,character:upd[0]})}catch(e){await conn.rollback();console.error('Complete todo error:', e);res.json({success:false,message:e.message||'Failed'})}finally{conn.release()}});

app.delete('/api/todos/:id', async (req,res)=>{try{await pool.execute('DELETE FROM todos WHERE id=?',[req.params.id]);res.json({success:true})}catch(e){res.json({success:false})}});

app.get('/api/dungeons',(req,res)=>{const list=Object.entries(DUNGEONS).map(([l,d])=>({level:parseInt(l),name:d.name,recommendedLevel:d.recommendedLevel}));res.json({success:true,dungeons:list})});

app.post('/api/dungeons', async (req,res)=>{const conn=await pool.getConnection();try{const{characterId,dungeonLevel}=req.body;const[chars]=await pool.execute('SELECT*FROM characters WHERE id=?',[characterId]);if(chars.length===0)return res.json({success:false,message:'Character not found'});const ch=chars[0];const dungeon=DUNGEONS[dungeonLevel];if(!dungeon)return res.json({success:false,message:'Dungeon not found'});if(ch.level<dungeon.recommendedLevel-2)return res.json({success:false,message:'Level too low'});let result={type:'',description:'',damage:0,gold:0,exp:0,equipment:null};const enc=Math.random();if(enc<0.5){const mid=dungeon.monsters[Math.floor(Math.random()*dungeon.monsters.length)];const m=MONSTERS[mid];const atkRoll=Math.floor(Math.random()*20)+1;const atkBonus=Math.max(getMod(ch.str),getMod(ch.dex));const totalAtk=atkRoll+atkBonus;let mHp=m.hp,pDmg=0,crit=false;if(totalAtk>=m.ac){if(atkRoll===20){crit=true;pDmg=Math.max(1,(getMod(ch.str)+Math.floor(Math.random()*8+4))*2)}else pDmg=Math.max(1,getMod(ch.str)+Math.floor(Math.random()*6+2));mHp-=pDmg}let mDmg=0;if(mHp>0){const defRoll=Math.floor(Math.random()*20)+1;const def=defRoll+Math.max(getMod(ch.dex),getMod(ch.con));const mAtk=Math.floor(Math.random()*20)+1;if(mAtk+(m.atk-10)/2>=def)mDmg=Math.max(0,m.atk-getMod(ch.con)+Math.floor(Math.random()*4+1));result.damage=mDmg}result.type='combat';result.monster={name:m.name,hp:m.hp};result.playerDamage=pDmg;result.monsterDefeated=mHp<=0;result.crit=crit;if(mHp<=0){const expB=crit?1.5:1;result.gold=Math.floor(m.gold*expB);result.exp=Math.floor(m.exp*expB);result.description=crit?`CRIT! Defeated ${m.name}! +${result.gold}Gold +${result.exp}EXP`:`Defeated ${m.name}! +${result.gold}Gold +${result.exp}EXP`;if(Math.random()<0.3+dungeonLevel*0.05){result.equipment=generateEquipment(dungeonLevel);result.description+=` Loot: ${result.equipment.name}(${result.equipment.rarity})!`}}else result.description=`Encounter ${m.name}, it attacks!`}else if(enc<0.85){const ev=dungeon.events[Math.floor(Math.random()*dungeon.events.length)];result.type=ev.type;switch(ev.type){case'treasure':result.gold=ev.gold;result.exp=ev.exp;result.description=ev.gold?`Found treasure! +${ev.gold}Gold +${ev.exp}EXP`:`Found treasure! +${ev.exp}EXP`;if(Math.random()<0.3){result.equipment=generateEquipment(dungeonLevel);result.description+=` Loot: ${result.equipment.name}(${result.equipment.rarity})!`}break;case'trap':if(abilityCheck(ch.dex,12))result.description='Trap triggered but you dodged!';else{result.damage=ev.damage;result.description=`Trap! -${ev.damage}HP`}break;case'heal':result.heal=ev.heal;result.description=`Found healing spring! +${ev.heal}HP`;break}}else{result.type='peaceful';result.exp=5+dungeonLevel*2;result.description=`Peaceful area. Explored and gained ${result.exp}EXP`}await conn.beginTransaction();let newHp=ch.hp-result.damage;if(result.heal)newHp=result.heal==='full'?ch.max_hp:Math.min(ch.max_hp,newHp+result.heal);const newGold=ch.gold+result.gold;let nE=ch.exp+result.exp,nL=ch.level,hG=0;while(nE>=100){nE-=100;nL++;hG+=Math.floor(Math.random()*3)+1}if(nL>ch.level)newHp=Math.min(ch.max_hp+hG,newHp+hG);await conn.execute('UPDATE characters SET hp=?,gold=?,exp=?,level=?,max_hp=max_hp+? WHERE id=?',[newHp,newGold,nE,nL,hG,characterId]);if(result.equipment)await conn.execute('INSERT INTO equipment(character_id,name,type,rarity,bonus_str,bonus_dex,bonus_con,bonus_int,bonus_wis,bonus_cha)VALUES(?,?,?,?,?,?,?,?,?,?)',[characterId,result.equipment.name,result.equipment.type,result.equipment.rarity,result.equipment.bonus_str||0,result.equipment.bonus_dex||0,result.equipment.bonus_con||0,result.equipment.bonus_int||0,result.equipment.bonus_wis||0,result.equipment.bonus_cha||0]);const[upd]=await conn.execute('SELECT*FROM characters WHERE id=?',[characterId]);await conn.commit();res.json({success:true,result,character:upd[0],levelUp:nL>ch.level})}catch(e){await conn.rollback();console.error(e);res.json({success:false,message:'Adventure failed'})}finally{conn.release()}});

app.get('/api/equipment/:characterId', async (req,res)=>{try{const[eq]=await pool.execute('SELECT*FROM equipment WHERE character_id=? ORDER BY created_at DESC',[req.params.characterId]);res.json({success:true,equipment:eq})}catch(e){res.json({success:false})}});

app.post('/api/equipment/:id/equip', async (req,res)=>{try{const{characterId,equip}=req.body;const[eqs]=await pool.execute('SELECT*FROM equipment WHERE id=?',[req.params.id]);if(eqs.length===0)return res.json({success:false,message:'Equipment not found'});const eq=eqs[0];if(equip){await pool.execute('UPDATE equipment SET equipped=0 WHERE character_id=? AND type=?',[characterId,eq.type])}await pool.execute('UPDATE equipment SET equipped=? WHERE id=?',[equip?1:0,req.params.id]);const[eqList]=await pool.execute('SELECT*FROM equipment WHERE character_id=? AND equipped=1',[characterId]);let bonus={str:0,dex:0,con:0,int:0,wis:0,cha:0};eqList.forEach(e=>{bonus.str+=e.bonus_str||0;bonus.dex+=e.bonus_dex||0;bonus.con+=e.bonus_con||0;bonus.int+=e.bonus_int||0;bonus.wis+=e.bonus_wis||0;bonus.cha+=e.bonus_cha||0});res.json({success:true,equipped:eqList,bonus})}catch(e){console.error('Equip error:',e);res.json({success:false,message:e.message})}});

app.delete('/api/equipment/:id', async (req,res)=>{try{const[eqs]=await pool.execute('SELECT*FROM equipment WHERE id=?',[req.params.id]);if(eqs.length===0)return res.json({success:false});const prices={common:5,uncommon:15,rare:50,epic:200};const price=prices[eqs[0].rarity]||5;await pool.execute('UPDATE characters SET gold=gold+? WHERE id=?',[price,eqs[0].character_id]);await pool.execute('DELETE FROM equipment WHERE id=?',[req.params.id]);res.json({success:true,price})}catch(e){res.json({success:false})}});

const SHOP_ITEMS=[{name:"Small Potion",type:"potion",rarity:"common",price:20,heal:10,desc:"+10 HP"},{name:"Medium Potion",type:"potion",rarity:"uncommon",price:50,heal:25,desc:"+25 HP"},{name:"Large Potion",type:"potion",rarity:"rare",price:100,heal:50,desc:"+50 HP"},{name:"Iron Sword",type:"weapon",rarity:"common",price:100,bonus_str:2,desc:"+2 STR"},{name:"Magic Wand",type:"weapon",rarity:"uncommon",price:300,bonus_int:3,desc:"+3 INT"}];

app.get('/api/shop',(req,res)=>res.json({success:true,items:SHOP_ITEMS}));

app.post('/api/shop/buy', async (req,res)=>{try{const{characterId,itemId}=req.body;const[chars]=await pool.execute('SELECT*FROM characters WHERE id=?',[characterId]);if(chars.length===0)return res.json({success:false});const ch=chars[0];const item=SHOP_ITEMS[itemId-1];if(!item)return res.json({success:false});if(ch.gold<item.price)return res.json({success:false,message:'Not enough gold!'});if(item.type==='potion'){const newHp=Math.min(ch.max_hp,ch.hp+item.heal);await pool.execute('UPDATE characters SET gold=gold-?,hp=? WHERE id=?',[item.price,newHp,characterId]);return res.json({success:true,message:`Used ${item.name}, HP now ${newHp}/${ch.max_hp}`,hp:newHp})}await pool.execute('INSERT INTO equipment(character_id,name,type,rarity,bonus_str,bonus_dex,bonus_con,bonus_int,bonus_wis,bonus_cha)VALUES(?,?,?,?,?,?,?,?,?,?)',[characterId,item.name,item.type,item.rarity,item.bonus_str||0,item.bonus_dex||0,item.bonus_con||0,item.bonus_int||0,item.bonus_wis||0,item.bonus_cha||0]);await pool.execute('UPDATE characters SET gold=gold-? WHERE id=?',[item.price,characterId]);res.json({success:true,message:`Bought ${item.name}!`,item})}catch(e){res.json({success:false})}});

// ==================== 经验升级检查API ====================
// 检查角色是否应该升级
app.post('/api/character/:id/check-level-up', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [chars] = await conn.execute('SELECT * FROM characters WHERE id=?', [req.params.id]);
    if (chars.length === 0) return res.json({ success: false, message: 'Character not found' });
    const ch = chars[0];
    
    let newExp = ch.exp;
    let newLevel = ch.level;
    let hpGain = 0;
    
    // 检查是否应该升级
    while (newExp >= 100) {
      newExp -= 100;
      newLevel++;
      hpGain += Math.floor(Math.random() * 3) + 1;
    }
    
    if (newLevel > ch.level) {
      // 需要升级
      await conn.execute(
        'UPDATE characters SET exp=?, level=?, hp=hp+?, max_hp=max_hp+? WHERE id=?',
        [newExp, newLevel, hpGain, hpGain, ch.id]
      );
      
      const [upd] = await conn.execute('SELECT * FROM characters WHERE id=?', [ch.id]);
      
      res.json({
        success: true,
        levelUp: true,
        newLevel: newLevel,
        hpGained: hpGain,
        oldLevel: ch.level,
        oldExp: ch.exp,
        newExp: newExp,
        character: upd[0]
      });
    } else {
      res.json({
        success: true,
        levelUp: false,
        message: '经验不足，无法升级',
        currentExp: ch.exp,
        required: 100,
        currentLevel: ch.level
      });
    }
  } catch (e) {
    console.error('Check level up error:', e);
    res.json({ success: false, message: e.message });
  } finally {
    conn.release();
  }
});

// ==================== 回合制战斗系统 ====================

// 开始地城探险（多层）
app.post('/api/dungeon/start', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { characterId, dungeonLevel } = req.body;

    // 检查角色
    const [chars] = await conn.execute('SELECT * FROM characters WHERE id=?', [characterId]);
    if (chars.length === 0) return res.json({ success: false, message: 'Character not found' });
    const ch = chars[0];

    // 检查地城
    const dungeon = DUNGEONS[dungeonLevel];
    if (!dungeon) return res.json({ success: false, message: 'Dungeon not found' });
    if (ch.level < dungeon.recommendedLevel - 2) return res.json({ success: false, message: 'Level too low' });

    // 生成楼层
    const floors = [];
    // 根据地城等级调整层数
    let floorCount;
    if (dungeonLevel <= 2) floorCount = 3;
    else if (dungeonLevel <= 5) floorCount = 4 + Math.floor(Math.random() * 2); // 4-5层
    else floorCount = 5 + Math.floor(Math.random() * 2); // 5-6层

    for (let f = 0; f < floorCount; f++) {
      const roomCount = dungeonLevel <= 2 ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 4); // 新手2-3个，老手3-7个
      const rooms = [];
      for (let r = 0; r < roomCount; r++) {
        const rand = Math.random();
        let roomType = 'combat';
        if (rand < 0.35) roomType = 'combat';
        else if (rand < 0.6) roomType = 'treasure';
        else if (rand < 0.7) roomType = 'trap';
        else if (rand < 0.8) roomType = 'event';
        else roomType = 'rest';
        rooms.push({ type: roomType, visited: false });
      }
      // Boss 房间（最后一层）
      if (f === floorCount - 1) {
        rooms[rooms.length - 1] = { type: 'boss', visited: false };
      }
      floors.push(rooms);
    }

    // 创建地城运行记录
    const [runResult] = await conn.execute(
      `INSERT INTO dungeon_runs (character_id, dungeon_level, current_floor, current_room, floors, player_hp, player_mp, in_battle, current_battle)
       VALUES (?, ?, 0, 0, ?, ?, ?, false, '{}')`,
      [characterId, dungeonLevel, JSON.stringify(floors), ch.hp, ch.mp]
    );

    res.json({
      success: true,
      runId: runResult.insertId,
      floors,
      currentFloor: 0,
      currentRoom: 0,
      playerHp: ch.hp,
      playerMp: ch.mp
    });
  } catch (e) {
    console.error('Start dungeon error:', e);
    res.json({ success: false, message: 'Failed to start dungeon' });
  } finally {
    conn.release();
  }
});

// 探索房间（自动战斗版本）
app.post('/api/dungeon/explore', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { characterId, runId, battleStyle: requestedBattleStyle } = req.body;

    // 获取角色信息（包含装备加成）
    const [chars] = await conn.execute(`
      SELECT c.*,
        COALESCE(SUM(e.bonus_str), 0) as bonus_str,
        COALESCE(SUM(e.bonus_dex), 0) as bonus_dex,
        COALESCE(SUM(e.bonus_con), 0) as bonus_con,
        COALESCE(SUM(e.bonus_int), 0) as bonus_int,
        COALESCE(SUM(e.bonus_wis), 0) as bonus_wis,
        COALESCE(SUM(e.bonus_cha), 0) as bonus_cha
      FROM characters c
      LEFT JOIN equipment e ON c.id = e.character_id AND e.equipped = 1
      WHERE c.id = ?
      GROUP BY c.id
    `, [characterId]);
    if (chars.length === 0) return res.json({ success: false, message: 'Character not found' });
    const ch = chars[0];

    // 使用请求中的战斗风格，或使用角色保存的设置
    const battleStyle = requestedBattleStyle || ch.battle_style || 'balanced';

    // 获取地城运行状态
    const [runs] = await conn.execute('SELECT * FROM dungeon_runs WHERE id=? AND character_id=?', [runId, characterId]);
    if (runs.length === 0) return res.json({ success: false, message: 'Dungeon run not found' });
    const run = runs[0];

    const floors = typeof run.floors === 'string' ? JSON.parse(run.floors) : run.floors;
    const currentFloor = floors[run.current_floor];
    const dungeon = DUNGEONS[parseInt(run.dungeon_level)];

    if (run.current_room >= currentFloor.length) {
      // 进入下一层
      if (run.current_floor >= floors.length - 1) {
        // 通关地城
        await conn.execute('DELETE FROM dungeon_runs WHERE id=?', [runId]);
        return res.json({
          success: true,
          type: 'victory',
          message: '🎉 Dungeon Cleared! You defeated the boss!',
          reward: { gold: 100 + parseInt(run.dungeon_level) * 50, exp: 50 + parseInt(run.dungeon_level) * 25 }
        });
      }
      await conn.execute('UPDATE dungeon_runs SET current_floor=current_floor+1, current_room=0 WHERE id=?', [runId]);
      return res.json({
        success: true,
        type: 'next_floor',
        message: `🚪 Entering Floor ${run.current_floor + 2}...`
      });
    }

    const room = currentFloor[run.current_room];
    let result = { type: room.type, description: '', reward: {} };

    if (room.type === 'combat' || room.type === 'boss') {
      // 自动战斗系统
      const mid = room.type === 'boss' ? dungeon.monsters[dungeon.monsters.length - 1] : dungeon.monsters[Math.floor(Math.random() * dungeon.monsters.length)];
      const monster = MONSTERS[mid];

      // 调用自动战斗函数
      const battleResult = autoBattle(ch, monster, battleStyle);

      // 更新角色HP/MP
      await conn.execute('UPDATE characters SET hp=?, mp=? WHERE id=?',
        [battleResult.remainingHp, battleResult.remainingMp, characterId]);
      await conn.execute('UPDATE dungeon_runs SET player_hp=?, player_mp=?, current_room=current_room+1 WHERE id=?',
        [battleResult.remainingHp, battleResult.remainingMp, runId]);

      // 处理战斗结果
      if (battleResult.result === 'victory') {
        result.description = `⚔️ 遭遇 ${monster.name}！战斗胜利！`;
        result.type = 'combat_victory';
        result.battleLog = battleResult.logs;

        // 发放奖励
        const rewards = battleResult.rewards;
        await conn.execute('UPDATE characters SET exp=exp+?, gold=gold+? WHERE id=?',
          [rewards.exp, rewards.gold, characterId]);

        result.reward = {
          exp: rewards.exp,
          gold: rewards.gold,
          isCrit: rewards.isCrit
        };
        result.description += rewards.isCrit ? ' (暴击！)' : '';
        result.description += `\n获得 ${rewards.exp} 经验，${rewards.gold} 金币`;

        // 检查装备掉落
        const lootRoll = Math.random();
        const lootChance = 0.3 + (parseInt(run.dungeon_level) * 0.05) + (ch.cha - 10) * 0.02;
        if (lootRoll < lootChance) {
          const equipment = generateEquipment(parseInt(run.dungeon_level));
          await conn.execute('INSERT INTO equipment (character_id, name, type, rarity, bonus_str, bonus_dex, bonus_con, bonus_int, bonus_wis, bonus_cha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [characterId, equipment.name, equipment.type, equipment.rarity, equipment.bonus_str, equipment.bonus_dex, equipment.bonus_con, equipment.bonus_int, equipment.bonus_wis, equipment.bonus_cha]);

          result.reward.equipment = equipment;
          result.description += `\n💎 装备掉落：${equipment.name}！`;
        }

        // 检查升级
        const newExp = ch.exp + rewards.exp;
        if (newExp >= 100) {
          const levelUp = Math.floor(newExp / 100);
          const newLevel = ch.level + levelUp;
          const hpGain = levelUp * 5;
          const mpGain = levelUp * 3;

          await conn.execute('UPDATE characters SET level=?, exp=?, max_hp=max_hp+?, max_mp=max_mp+? WHERE id=?',
            [newLevel, newExp % 100, hpGain, mpGain, characterId]);

          result.levelUp = { levels: levelUp, newLevel, hpGain, mpGain };
          result.description += `\n\n🎉 升级了 ${levelUp} 级！达到 ${newLevel} 级！`;
        }

      } else if (battleResult.result === 'flee') {
        result.description = `⚔️ 遭遇 ${monster.name}！成功逃跑！`;
        result.type = 'flee';
        result.battleLog = battleResult.logs;

      } else {
        // 战斗失败
        await conn.execute('DELETE FROM dungeon_runs WHERE id=?', [runId]);
        return res.json({
          success: true,
          type: 'defeat',
          message: `💀 被 ${monster.name} 击败了...`,
          battleLog: battleResult.logs,
          remainingHp: 0
        });
      }
    } else if (room.type === 'treasure') {
      const gold = 10 + Math.floor(Math.random() * 20) * parseInt(run.dungeon_level);
      result.reward.gold = gold;
      result.description = `💎 Found treasure! +${gold} Gold`;

      await conn.execute('UPDATE characters SET gold=gold+? WHERE id=?', [gold, characterId]);
      await conn.execute('UPDATE dungeon_runs SET current_room=current_room+1 WHERE id=?', [runId]);
    } else if (room.type === 'trap') {
      const dmg = 1 + Math.floor(Math.random() * 4) + Math.floor(parseInt(run.dungeon_level) / 2);
      result.reward.damage = dmg;
      result.description = `⚠️ Trap! -${dmg} HP`;

      const newHp = Math.max(0, run.player_hp - dmg);
      await conn.execute('UPDATE characters SET hp=? WHERE id=?', [newHp, characterId]);
      await conn.execute('UPDATE dungeon_runs SET player_hp=?, current_room=current_room+1 WHERE id=?', [newHp, runId]);

      if (newHp <= 0) {
        await conn.execute('DELETE FROM dungeon_runs WHERE id=?', [runId]);
        return res.json({ success: true, type: 'defeat', message: '💀 You were defeated by a trap!' });
      }
    } else if (room.type === 'rest') {
      const heal = Math.floor(run.player_hp * 0.3) + 10;
      const mpHeal = Math.floor(run.player_mp * 0.3) + 5;

      await conn.execute('UPDATE characters SET hp=?, mp=? WHERE id=?',
        [Math.min(run.player_hp + heal, ch.max_hp), Math.min(run.player_mp + mpHeal, ch.max_mp), characterId]);
      await conn.execute('UPDATE dungeon_runs SET player_hp=?, player_mp=?, current_room=current_room+1 WHERE id=?',
        [Math.min(run.player_hp + heal, ch.max_hp), Math.min(run.player_mp + mpHeal, ch.max_mp), runId]);

      result.reward.heal = heal;
      result.reward.mpHeal = mpHeal;
      result.description = `🌟 Rest area! +${heal} HP, +${mpHeal} MP`;
    } else {
      // event
      result.description = '📜 Strange markings on the wall... nothing happens.';
      await conn.execute('UPDATE dungeon_runs SET current_room=current_room+1 WHERE id=?', [runId]);
    }

    res.json({ success: true, ...result });
  } catch (e) {
    console.error('Explore room error:', e);
    res.json({ success: false, message: 'Failed to explore' });
  } finally {
    conn.release();
  }
});

// ==================== 战斗设置系统 ====================

// 获取战斗设置
app.get('/api/character/:characterId/battle-settings', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [chars] = await conn.execute('SELECT battle_style FROM characters WHERE id=?', [req.params.characterId]);
    if (chars.length === 0) {
      return res.json({ success: false, message: 'Character not found' });
    }

    res.json({
      success: true,
      battleStyle: chars[0].battle_style || 'balanced'
    });
  } catch (e) {
    console.error('Get battle settings error:', e);
    res.json({ success: false, message: 'Failed to get battle settings' });
  } finally {
    conn.release();
  }
});

// 保存战斗设置
app.post('/api/character/:characterId/battle-settings', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { battleStyle } = req.body;

    // 验证战斗风格
    const validStyles = ['aggressive', 'balanced', 'defensive'];
    if (!validStyles.includes(battleStyle)) {
      return res.json({ success: false, message: 'Invalid battle style' });
    }

    await conn.execute('UPDATE characters SET battle_style=? WHERE id=?',
      [battleStyle, req.params.characterId]);

    res.json({
      success: true,
      message: 'Battle settings updated',
      battleStyle
    });
  } catch (e) {
    console.error('Save battle settings error:', e);
    res.json({ success: false, message: 'Failed to save battle settings' });
  } finally {
    conn.release();
  }
});

// ==================== 组队地城系统 ====================

// 开启组队地城
app.post('/api/dungeon/start-party', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { partyId, dungeonLevel, userId } = req.body;

    console.log('Start party dungeon request:', { partyId, dungeonLevel, userId });

    // 检查用户是否是队长
    const [partyInfo] = await conn.execute(
      'SELECT leader_id FROM parties WHERE id = ?',
      [partyId]
    );

    if (!partyInfo || partyInfo.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }

    if (partyInfo[0].leader_id !== parseInt(userId)) {
      return res.json({ success: false, message: 'Only party leader can start dungeon' });
    }

    // 获取所有队员
    const [members] = await conn.execute(
      'SELECT pm.*, c.hp, c.max_hp, c.mp, c.max_mp, c.level, c.name as character_name ' +
      'FROM party_members pm ' +
      'JOIN characters c ON pm.character_id = c.id ' +
      'WHERE pm.party_id = ?',
      [partyId]
    );

    if (members.length === 0) {
      return res.json({ success: false, message: 'No members in party' });
    }

    // 检查地城
    const dungeon = DUNGEONS[dungeonLevel];
    if (!dungeon) {
      return res.json({ success: false, message: 'Dungeon not found' });
    }

    // 检查成员等级要求
    for (const member of members) {
      if (member.level < dungeon.recommendedLevel - 2) {
        return res.json({ success: false, message: `Member ${member.character_name} level too low` });
      }
    }

    // 生成楼层
    const floorCount = dungeonLevel <= 2 ? 3 : 5 + Math.floor(Math.random() * 2);
    const floors = [];
    for (let f = 0; f < floorCount; f++) {
      const roomCount = dungeonLevel <= 2 ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 4);
      const rooms = [];
      for (let r = 0; r < roomCount; r++) {
        const rand = Math.random();
        let roomType = 'combat';
        if (rand < 0.35) roomType = 'combat';
        else if (rand < 0.6) roomType = 'treasure';
        else if (rand < 0.7) roomType = 'trap';
        else if (rand < 0.8) roomType = 'event';
        else roomType = 'rest';
        rooms.push({ type: roomType, visited: false, cleared: false });
      }
      // Boss 房间（最后一层）
      if (f === floorCount - 1) {
        rooms[rooms.length - 1] = { type: 'boss', visited: false, cleared: false };
      }
      floors.push(rooms);
    }

    // 为每个队员创建地城运行记录
    const partyDungeonId = Date.now() + '_' + partyId;
    for (const member of members) {
      await conn.execute(
        `INSERT INTO dungeon_runs (character_id, dungeon_level, current_floor, current_room, floors, player_hp, player_mp, in_battle, current_battle, party_dungeon_id)
         VALUES (?, ?, 0, 0, ?, ?, ?, false, '{}', ?)`,
        [member.character_id, dungeonLevel, JSON.stringify(floors), member.hp, member.mp, partyDungeonId]
      );
    }

    // 通知WebSocket
    if (app.broadcastPartyUpdate) {
      app.broadcastPartyUpdate(partyId, 'dungeon_started', {
        partyDungeonId,
        dungeonLevel,
        floors,
        members: members.map(m => ({
          userId: m.user_id,
          characterId: m.character_id,
          characterName: m.character_name,
          level: m.level
        })),
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      partyDungeonId,
      dungeonLevel,
      floors,
      members: members.map(m => ({
        characterId: m.character_id,
        characterName: m.character_name,
        level: m.level,
        hp: m.hp,
        mp: m.mp
      }))
    });
  } catch (e) {
    console.error('Start party dungeon error:', e);
    res.json({ success: false, message: 'Failed to start party dungeon', error: e.message });
  } finally {
    conn.release();
  }
});

// 组队探索房间
app.post('/api/dungeon/party-explore', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { partyDungeonId, characterId } = req.body;

    // 获取地城运行状态
    const [runs] = await conn.execute(
      'SELECT * FROM dungeon_runs WHERE party_dungeon_id = ? AND character_id = ?',
      [partyDungeonId, characterId]
    );

    if (runs.length === 0) {
      return res.json({ success: false, message: 'Dungeon run not found' });
    }

    const run = runs[0];
    const floors = JSON.parse(run.floors);
    const currentFloor = run.current_floor;
    const currentRoom = run.current_room;

    // 检查房间是否已访问
    if (floors[currentFloor][currentRoom].visited) {
      return res.json({ success: false, message: 'Room already explored' });
    }

    // 标记房间为已访问
    floors[currentFloor][currentRoom].visited = true;

    // 房间事件逻辑（与单人地城相同）
    const room = floors[currentFloor][currentRoom];
    let result = { message: '', type: room.type };

    if (room.type === 'combat' || room.type === 'boss') {
      // 生成怪物
      const monsterKeys = Object.keys(MONSTERS);
      const randomMonsterKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
      const monster = { ...MONSTERS[randomMonsterKey], currentHp: MONSTERS[randomMonsterKey].hp };
      result = { ...result, monster: monster };
    } else if (room.type === 'treasure') {
      // 宝箱奖励
      const goldReward = Math.floor(Math.random() * 20) + 10;
      result = { ...result, gold: goldReward };
    } else if (room.type === 'rest') {
      // 休息恢复
      const hpRecovery = Math.floor(run.max_hp * 0.3);
      const mpRecovery = Math.floor(run.max_mp * 0.3);
      const newHp = Math.min(run.hp + hpRecovery, run.max_hp);
      const newMp = Math.min(run.mp + mpRecovery, run.max_mp);
      result = { ...result, hpRecovery, mpRecovery, newHp, newMp };
    }

    // 更新地城运行状态
    await conn.execute(
      'UPDATE dungeon_runs SET current_room = ?, floors = ?, player_hp = ?, player_mp = ? WHERE id = ?',
      [currentRoom, JSON.stringify(floors), run.player_hp, run.player_mp, run.id]
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error('Party explore error:', e);
    res.json({ success: false, message: 'Failed to explore room', error: e.message });
  } finally {
    conn.release();
  }
});

// 组队战斗行动
app.post('/api/dungeon/party-battle-action', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { partyDungeonId, characterId, action, skillId } = req.body;

    // 获取地城运行状态
    const [runs] = await conn.execute(
      'SELECT * FROM dungeon_runs WHERE party_dungeon_id = ? AND character_id = ?',
      [partyDungeonId, characterId]
    );

    if (runs.length === 0) {
      return res.json({ success: false, message: 'Dungeon run not found' });
    }

    const run = runs[0];

    if (!run.in_battle) {
      return res.json({ success: false, message: 'Not in battle' });
    }

    const battle = JSON.parse(run.current_battle);
    const monster = battle.monster;
    const floors = JSON.parse(run.floors);
    const currentFloor = run.current_floor;
    const currentRoom = run.current_room;
    const room = floors[currentFloor][currentRoom];

    // 计算伤害
    let damage = Math.floor(Math.random() * 5) + run.str + 5;
    if (action === 'skill' && skillId) {
      const [skills] = await conn.execute(
        'SELECT * FROM skills WHERE id = ?',
        [skillId]
      );

      if (skills.length > 0) {
        const skill = skills[0];
        const effectData = JSON.parse(skill.effect_data);

        if (effectData.damage) {
          damage = effectData.damage;
        } else if (effectData.heal) {
          const newHp = Math.min(run.hp + effectData.heal, run.max_hp);
          await conn.execute(
            'UPDATE dungeon_runs SET player_hp = ? WHERE id = ?',
            [newHp, run.id]
          );

          // 标记回合
          battle.turn += 1;
          battle.cooldowns[skillId] = skill.cooldown;

          await conn.execute(
            'UPDATE dungeon_runs SET current_battle = ? WHERE id = ?',
            [JSON.stringify(battle), run.id]
          );

          return res.json({
            success: true,
            action: 'heal',
            healAmount: effectData.heal,
            newHp: newHp,
            turn: battle.turn
          });
        }

        if (run.mp < skill.mp_cost) {
          return res.json({ success: false, message: 'Not enough MP' });
        }

        await conn.execute(
          'UPDATE dungeon_runs SET player_mp = player_mp - ? WHERE id = ?',
          [skill.mp_cost, run.id]
        );
      }
    }

    // 暴击检查
    const critChance = 0.05 + (run.dex - 10) * 0.01;
    const isCrit = Math.random() < critChance;
    if (isCrit) damage = Math.floor(damage * 1.5);

    // 怪物防御
    const monsterData = MONSTERS[monster.id];
    const defense = monsterData.ac;
    const damageReduction = Math.max(0, (defense - 10) * 0.1);
    const finalDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));

    monster.currentHp -= finalDamage;

    // 怪物反击（如果还活着）
    let monsterDamage = 0;
    if (monster.currentHp > 0) {
      monsterDamage = Math.floor(Math.random() * 3) + monsterData.atk;
      const playerDefense = 10 + run.con;
      const playerDamageReduction = Math.max(0, (playerDefense - 10) * 0.1);
      monsterDamage = Math.max(1, Math.floor(monsterDamage * (1 - playerDamageReduction)));

      const newHp = Math.max(0, run.hp - monsterDamage);
      await conn.execute(
        'UPDATE dungeon_runs SET player_hp = ? WHERE id = ?',
        [newHp, run.id]
      );
    }

    battle.monster.currentHp = monster.currentHp;
    battle.turn += 1;

    await conn.execute(
      'UPDATE dungeon_runs SET current_battle = ? WHERE id = ?',
      [JSON.stringify(battle), run.id]
    );

    // 检查战斗是否结束
    const battleWon = monster.currentHp <= 0;
    const battleLost = run.hp <= 0;

    if (battleWon) {
      // 战斗胜利
      room.cleared = true;
      floors[currentFloor][currentRoom] = room;

      const expReward = monsterData.exp;
      const goldReward = monsterData.gold;

      await conn.execute(
        'UPDATE dungeon_runs SET floors = ? WHERE id = ?',
        [JSON.stringify(floors), run.id]
      );

      return res.json({
        success: true,
        battleWon: true,
        expReward,
        goldReward,
        monster: monsterData
      });
    }

    if (battleLost) {
      // 战斗失败
      return res.json({
        success: true,
        battleLost: true
      });
    }

    res.json({
      success: true,
      damage: finalDamage,
      isCrit,
      monsterDamage,
      monsterHp: monster.currentHp,
      monsterMaxHp: monsterData.hp,
      playerHp: run.hp,
      playerMaxHp: run.max_hp,
      turn: battle.turn
    });
  } catch (e) {
    console.error('Party battle action error:', e);
    res.json({ success: false, message: 'Failed to perform battle action', error: e.message });
  } finally {
    conn.release();
  }
});

// 战斗行动（攻击/技能）
app.post('/api/battle/action', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { characterId, runId, action, skillId } = req.body;

    // 获取地城运行状态
    const [runs] = await conn.execute('SELECT * FROM dungeon_runs WHERE id=? AND character_id=?', [runId, characterId]);
    if (runs.length === 0) return res.json({ success: false, message: 'Battle not found' });
    const run = runs[0];

    if (!run.in_battle) return res.json({ success: false, message: 'Not in battle' });

    const battle = typeof run.current_battle === 'string' ? JSON.parse(run.current_battle) : run.current_battle;
    const monster = MONSTERS[battle.monsterId];

    // 获取角色信息
    const [chars] = await conn.execute('SELECT * FROM characters WHERE id=?', [characterId]);
    if (chars.length === 0) return res.json({ success: false, message: 'Character not found' });
    const ch = chars[0];

    // 玩家行动
    let playerDmg = 0;
    let actionDesc = '';

    if (action === 'attack') {
      const atkRoll = Math.floor(Math.random() * 20) + 1;
      // 简化伤害公式：STR + d6
      playerDmg = ch.str + Math.floor(Math.random() * 6) + 1;

      if (atkRoll >= 10) { // AC 10
        if (atkRoll === 20) {
          playerDmg *= 2;
          actionDesc = `💥 CRITICAL HIT! ${playerDmg} damage!`;
        } else {
          actionDesc = `⚔️ Attack hits for ${playerDmg} damage!`;
        }
      } else {
        playerDmg = 0;
        actionDesc = '❌ Attack missed!';
      }
    } else if (action === 'skill' && skillId) {
      // 获取玩家技能
      const [playerSkills] = await conn.execute('SELECT ps.*, s.display_name, s.mp_cost, s.effect_data FROM player_skills ps JOIN skills s ON ps.skill_id = s.id WHERE ps.character_id=? AND s.id=?', [characterId, skillId]);
      if (playerSkills.length === 0) return res.json({ success: false, message: 'Skill not learned' });

      const skill = playerSkills[0];
      if (battle.playerMp < skill.mp_cost) return res.json({ success: false, message: 'Not enough MP!' });

      const effect = typeof skill.effect_data === 'string' ? JSON.parse(skill.effect_data) : skill.effect_data;

      // 应用技能效果
      battle.playerMp -= skill.mp_cost;

      if (skill.display_name === '火球术' || skill.display_name === '冰霜术') {
        playerDmg = effect.damage;
        actionDesc = `🔥 ${skill.display_name}! ${playerDmg} ${effect.element} damage!`;
      } else if (skill.display_name === '治疗术' || skill.display_name === '圣光术') {
        const heal = effect.heal;
        battle.playerHp = Math.min(battle.playerHp + heal, ch.max_hp);
        actionDesc = `💚 ${skill.display_name}! +${heal} HP!`;
      } else if (skill.display_name === '冲锋') {
        playerDmg = ch.str + Math.floor(Math.random() * 6) + 1 + effect.damage_bonus;
        actionDesc = `⚡ 冲锋! ${playerDmg} damage!`;
      } else if (skill.display_name === '盾牌格挡' || skill.display_name === '护盾') {
        actionDesc = `🛡️ ${skill.display_name}! Damage reduced this turn!`;
      } else {
        actionDesc = `⚡ ${skill.display_name}!`;
      }
    }

    battle.monsterHp -= playerDmg;

    // 检查怪物是否死亡
    if (battle.monsterHp <= 0) {
      await conn.execute('UPDATE dungeon_runs SET in_battle=false, current_battle=? WHERE id=?', ['{}', runId]);

      // 掉落奖励
      const gold = monster.gold + Math.floor(Math.random() * 10);
      const exp = monster.exp;

      await conn.execute('UPDATE characters SET gold=gold+?, exp=exp+? WHERE id=?', [gold, exp, characterId]);

      return res.json({
        success: true,
        type: 'victory',
        description: `🎉 ${actionDesc}<br><br>Defeated ${battle.monsterName}!<br><strong>💰 +${gold} Gold</strong> <strong>✨ +${exp} EXP</strong>`,
        reward: { gold, exp }
      });
    }

    // 怪物反击
    const monsterAtkRoll = Math.floor(Math.random() * 20) + 1;
    const monsterTotalAtk = monsterAtkRoll + Math.floor((monster.atk - 10) / 2);
    const playerDef = getMod(ch.dex) + getMod(ch.con);

    let monsterDmg = 0;
    if (monsterTotalAtk >= playerDef) {
      monsterDmg = Math.max(1, monster.atk - getMod(ch.con) + Math.floor(Math.random() * 4 + 1));
    }

    battle.playerHp -= monsterDmg;
    battle.turn += 1;

    // 更新战斗状态
    await conn.execute('UPDATE dungeon_runs SET current_battle=?, player_hp=?, player_mp=? WHERE id=?',
      [JSON.stringify(battle), battle.playerHp, battle.playerMp, runId]);

    // 检查玩家是否死亡
    if (battle.playerHp <= 0) {
      await conn.execute('DELETE FROM dungeon_runs WHERE id=?', [runId]);
      return res.json({
        success: true,
        type: 'defeat',
        description: `💀 ${actionDesc}<br><br>👹 ${battle.monsterName} attacks! <strong style="color:#e74c3c">-${monsterDmg} HP</strong><br><br><strong style="color:#e74c3c">You were defeated!</strong>`
      });
    }

    res.json({
      success: true,
      type: 'continue',
      description: `${actionDesc}<br><br>👹 ${battle.monsterName} attacks! <strong style="color:#e74c3c">-${monsterDmg} HP</strong>`,
      battle,
      monsterDmg
    });

  } catch (e) {
    console.error('Battle action error:', e);
    res.json({ success: false, message: 'Battle action failed' });
  } finally {
    conn.release();
  }
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

initDatabase().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Potato Dungeon API running on port ${PORT}`);
  });

  // 创建WebSocket服务器（使用单独的端口）
  const wss = new WebSocket.Server({ port: WS_PORT });
  console.log(`WebSocket server listening on port ${WS_PORT}`);

  // 处理WebSocket服务器错误（不退出进程）
  wss.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`WebSocket port ${WS_PORT} is already in use, but continuing...`);
    } else {
      console.error('WebSocket server error:', error);
    }
  });

  // 存储连接：{ userId: { ws, characterId, currentPartyId } }
  const connections = new Map();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data);

        switch (data.type) {
          case 'authenticate':
            // 认证连接
            connections.set(data.userId, {
              ws,
              characterId: data.characterId,
              currentPartyId: null
            });
            ws.send(JSON.stringify({ type: 'authenticated', success: true }));
            break;

          case 'join_party_room':
            // 加入队伍房间
            const conn = connections.get(data.userId);
            if (conn) {
              conn.currentPartyId = data.partyId;
              // 通知房间中的其他成员
              broadcastToParty(data.partyId, {
                type: 'member_joined',
                userId: data.userId,
                characterId: data.characterId,
                username: data.username
              }, data.userId);
            }
            break;

          case 'leave_party_room':
            // 离开队伍房间
            const conn2 = connections.get(data.userId);
            if (conn2) {
              const oldPartyId = conn2.currentPartyId;
              conn2.currentPartyId = null;
              // 通知房间中的其他成员
              if (oldPartyId) {
                broadcastToParty(oldPartyId, {
                  type: 'member_left',
                  userId: data.userId
                }, data.userId);
              }
            }
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // 清理连接
      for (const [userId, conn] of connections.entries()) {
        if (conn.ws === ws) {
          const partyId = conn.currentPartyId;
          connections.delete(userId);
          if (partyId) {
            // 通知队伍房间
            broadcastToParty(partyId, {
              type: 'member_offline',
              userId: userId
            });
          }
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // 广播消息到指定队伍的所有成员
  function broadcastToParty(partyId, message, excludeUserId = null) {
    for (const [userId, conn] of connections.entries()) {
      if (conn.currentPartyId === partyId && userId !== excludeUserId) {
        try {
          conn.ws.send(JSON.stringify(message));
        } catch (e) {
          console.error('Failed to send message to user:', userId, e);
        }
      }
    }
  }

  // 导出广播函数供其他API使用
  global.broadcastToParty = broadcastToParty;

  // 当队伍状态改变时，通知所有成员
  app.broadcastPartyUpdate = (partyId, updateType, data) => {
    broadcastToParty(partyId, {
      type: updateType,
      ...data,
      partyId: partyId
    });
  };

  console.log('WebSocket server started');

}).catch(console.error);

// ==================== 好友系统 ====================

// 获取好友列表
app.get('/api/friends/:userId', async (req, res) => {
  try {
    const [friends] = await pool.execute(`
      SELECT f.*, u.username as friend_username, c.name as character_name, c.level as character_level
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN characters c ON c.user_id = u.id AND c.id = (
        SELECT id FROM characters WHERE user_id = u.id ORDER BY level DESC LIMIT 1
      )
      WHERE f.user_id = ? AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `, [req.params.userId]);
    
    res.json({ success: true, friends: friends });
  } catch (e) {
    console.error('Get friends error:', e);
    res.json({ success: false, message: 'Failed to get friends' });
  }
});

// 获取好友请求
app.get('/api/friends/:userId/requests', async (req, res) => {
  try {
    const [requests] = await pool.execute(`
      SELECT f.*, u.username as requester_username, c.name as character_name, c.level as character_level
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN characters c ON c.user_id = u.id AND c.id = (
        SELECT id FROM characters WHERE user_id = u.id ORDER BY level DESC LIMIT 1
      )
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [req.params.userId]);
    
    res.json({ success: true, requests: requests });
  } catch (e) {
    console.error('Get friend requests error:', e);
    res.json({ success: false, message: 'Failed to get requests' });
  }
});

// 添加好友
app.post('/api/friends', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, friendUsername } = req.body;
    
    // 查找好友用户
    const [users] = await conn.execute('SELECT id FROM users WHERE username = ?', [friendUsername]);
    if (users.length === 0) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    const friendId = users[0].id;
    
    // 不能添加自己
    if (userId == friendId) {
      return res.json({ success: false, message: 'Cannot add yourself' });
    }
    
    // 检查是否已经是好友
    const [existing] = await conn.execute(
      'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
      [userId, friendId]
    );
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Already friends or pending' });
    }
    
    // 创建好友请求
    await conn.execute(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")',
      [userId, friendId]
    );
    
    res.json({ success: true, message: 'Friend request sent' });
  } catch (e) {
    console.error('Add friend error:', e);
    res.json({ success: false, message: 'Failed to add friend' });
  } finally {
    conn.release();
  }
});

// 接受好友请求
app.post('/api/friends/:friendId/accept', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await pool.execute(
      'UPDATE friendships SET status = "accepted" WHERE user_id = ? AND friend_id = ?',
      [req.params.friendId, userId]
    );
    
    res.json({ success: true, message: 'Friend added' });
  } catch (e) {
    console.error('Accept friend error:', e);
    res.json({ success: false, message: 'Failed to accept friend' });
  }
});

// 拒绝好友请求
app.post('/api/friends/:friendId/reject', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await pool.execute(
      'DELETE FROM friendships WHERE user_id = ? AND friend_id = ? AND status = "pending"',
      [req.params.friendId, userId]
    );
    
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (e) {
    console.error('Reject friend error:', e);
    res.json({ success: false, message: 'Failed to reject friend' });
  }
});

// 删除好友
app.delete('/api/friends/:friendId', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await pool.execute(
      'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?',
      [userId, req.params.friendId]
    );
    
    res.json({ success: true, message: 'Friend removed' });
  } catch (e) {
    console.error('Delete friend error:', e);
    res.json({ success: false, message: 'Failed to delete friend' });
  }
});

// ==================== 组队系统 ====================

// 创建队伍
app.post('/api/parties', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, characterId, partyName } = req.body;
    
    // 检查用户是否已在队伍
    const [inParty] = await conn.execute(
      'SELECT pm.*, p.name as party_name FROM party_members pm JOIN parties p ON pm.party_id = p.id WHERE pm.user_id = ?',
      [userId]
    );
    
    if (inParty.length > 0) {
      return res.json({ success: false, message: 'Already in a party', currentParty: inParty[0] });
    }
    
    // 创建队伍
    const [partyResult] = await conn.execute(
      'INSERT INTO parties (leader_id, name) VALUES (?, ?)',
      [userId, partyName]
    );
    
    // 队长自动加入
    await conn.execute(
      'INSERT INTO party_members (party_id, user_id, character_id) VALUES (?, ?, ?)',
      [partyResult.insertId, userId, characterId]
    );
    
    res.json({ success: true, partyId: partyResult.insertId, message: 'Party created' });
  } catch (e) {
    console.error('Create party error:', e);
    res.json({ success: false, message: 'Failed to create party' });
  } finally {
    conn.release();
  }
});

// 加入队伍
app.post('/api/parties/:partyId/join', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, characterId } = req.body;
    const partyId = req.params.partyId;
    
    // 检查用户是否已在队伍
    const [inParty] = await conn.execute(
      'SELECT * FROM party_members WHERE user_id = ?',
      [userId]
    );
    
    if (inParty.length > 0) {
      return res.json({ success: false, message: 'Already in a party' });
    }
    
    // 检查队伍人数
    const [partyInfo] = await conn.execute(
      'SELECT COUNT(*) as count, max_members FROM parties WHERE id = ?',
      [partyId]
    );
    
    if (partyInfo[0].count >= partyInfo[0].max_members) {
      return res.json({ success: false, message: 'Party is full' });
    }
    
    // 加入队伍
    await conn.execute(
      'INSERT INTO party_members (party_id, user_id, character_id) VALUES (?, ?, ?)',
      [partyId, userId, characterId]
    );

    // 获取用户信息
    const [userInfo] = await conn.execute(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    // 获取角色信息
    const [charInfo] = await conn.execute(
      'SELECT name, level FROM characters WHERE id = ?',
      [characterId]
    );

    // 通过WebSocket通知队伍成员
    if (app.broadcastPartyUpdate) {
      app.broadcastPartyUpdate(parseInt(partyId), 'member_joined', {
        userId: userId,
        username: userInfo[0]?.username || 'Unknown',
        characterName: charInfo[0]?.name || 'Unknown',
        characterLevel: charInfo[0]?.level || 1,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Joined party' });
  } catch (e) {
    console.error('Join party error:', e);
    res.json({ success: false, message: 'Failed to join party' });
  } finally {
    conn.release();
  }
});

// 获取队伍列表
app.get('/api/parties/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const minLevel = parseInt(req.query.minLevel) || 0;
    const maxLevel = parseInt(req.query.maxLevel) || 999;
    const minMembers = parseInt(req.query.minMembers) || 0;
    const maxMembers = parseInt(req.query.maxMembers) || 4;
    const search = req.query.search || '';

    console.log('Party list request:', { page, limit, minLevel, maxLevel, minMembers, maxMembers, search });

    // 构建WHERE条件（用于表行过滤）
    const whereConditions = [];
    
    // 搜索筛选
    if (search && search.trim()) {
      whereConditions.push(`p.name LIKE '%${search.trim()}%'`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 构建HAVING条件（用于聚合结果过滤）
    const havingConditions = [];

    // 等级筛选
    if (minLevel > 0 || maxLevel < 999) {
      havingConditions.push(`AVG(c.level) >= ${minLevel} AND AVG(c.level) <= ${maxLevel}`);
    }

    // 人数筛选
    if (minMembers > 0 || maxMembers < 4) {
      havingConditions.push(`COUNT(DISTINCT pm.id) >= ${minMembers} AND COUNT(DISTINCT pm.id) <= ${maxMembers}`);
    }

    const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';
    const limitClause = `LIMIT ${limit}`;
    const offsetClause = `OFFSET ${offset}`;

    // 获取队伍列表（完整筛选版）
    const [parties] = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.max_members,
        COUNT(DISTINCT pm.id) as member_count,
        ROUND(AVG(c.level)) as avg_level,
        MIN(c.level) as min_level,
        MAX(c.level) as max_level,
        GROUP_CONCAT(DISTINCT c.profession_id) as professions,
        u.username as leader_username
      FROM parties p
      LEFT JOIN party_members pm ON p.id = pm.party_id
      LEFT JOIN characters c ON pm.character_id = c.id
      JOIN users u ON p.leader_id = u.id
      ${whereClause}
      GROUP BY p.id
      ${havingClause}
      ORDER BY member_count DESC, avg_level DESC
      ${limitClause}
      ${offsetClause}
    `);

    // 获取总数（应用相同的筛选）
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM (
        SELECT p.id
        FROM parties p
        LEFT JOIN party_members pm ON p.id = pm.party_id
        LEFT JOIN characters c ON pm.character_id = c.id
        ${whereClause}
        GROUP BY p.id
        ${havingClause}
      ) as filtered_parties
    `);

    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      parties: parties.map(party => ({
        id: party.id,
        name: party.name,
        maxMembers: party.max_members,
        memberCount: party.member_count || 0,
        avgLevel: party.avg_level || 0,
        minLevel: party.min_level || 0,
        maxLevel: party.max_level || 0,
        professions: party.professions ? party.professions.split(',').map(id => parseInt(id)) : [],
        leaderUsername: party.leader_username
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('Get party list error:', e);
    res.json({ success: false, message: 'Failed to get party list', error: e.message });
  }
});

// 获取队伍信息
app.get('/api/parties/:partyId', async (req, res) => {
  try {
    const [party] = await pool.execute(`
      SELECT p.*, u.username as leader_username, c.name as leader_character_name, c.level as leader_level
      FROM parties p
      JOIN users u ON p.leader_id = u.id
      LEFT JOIN characters c ON c.user_id = u.id AND c.id = (
        SELECT id FROM characters WHERE user_id = u.id ORDER BY level DESC LIMIT 1
      )
      WHERE p.id = ?
    `, [req.params.partyId]);
    
    if (party.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }
    
    const [members] = await pool.execute(`
      SELECT pm.*, u.username, c.name as character_name, c.level, c.str, c.dex, c.con, c.int_score, c.wis, c.cha
      FROM party_members pm
      JOIN users u ON pm.user_id = u.id
      JOIN characters c ON pm.character_id = c.id
      WHERE pm.party_id = ?
      ORDER BY c.level DESC
    `, [req.params.partyId]);
    
    res.json({ success: true, party: party[0], members: members });
  } catch (e) {
    console.error('Get party info error:', e);
    res.json({ success: false, message: 'Failed to get party info' });
  }
});

// 获取用户的队伍
app.get('/api/parties/user/:userId', async (req, res) => {
  try {
    const [party] = await pool.execute(`
      SELECT pm.*, p.name as party_name, p.leader_id, u.username as leader_username
      FROM party_members pm
      JOIN parties p ON pm.party_id = p.id
      JOIN users u ON p.leader_id = u.id
      WHERE pm.user_id = ?
    `, [req.params.userId]);
    
    if (party.length === 0) {
      return res.json({ success: true, party: null, message: 'Not in a party' });
    }
    
    res.json({ success: true, party: party[0] });
  } catch (e) {
    console.error('Get user party error:', e);
    res.json({ success: false, message: 'Failed to get party' });
  }
});

// 离开队伍
// 测试端点
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ success: true, message: 'Test OK', time: new Date().toISOString() });
});

app.get('/api/disband/:partyId', async (req, res) => {
  console.log('DISBAND CALLED - Party ID:', req.params.partyId);
  const partyId = parseInt(req.params.partyId);
  
  try {
    const conn = await pool.getConnection();
    await conn.execute('DELETE FROM party_members WHERE party_id = ?', [partyId]);
      await conn.execute('DELETE FROM parties WHERE id = ?', [partyId]);
    await conn.execute('DELETE FROM party_members WHERE party_id = ?', [partyId]);
    conn.release();
    res.json({ success: true, message: 'Party disbanded' });
  } catch (e) {
    console.error('Disband error:', e);
    res.json({ success: false, message: 'Failed to disband' });
  }
});

app.delete('/api/parties/:partyId/leave', async (req, res) => {
  console.log('DELETE /api/parties/:partyId/leave called, params:', req.params, 'body:', req.body);
  const conn = await pool.getConnection();
  try {
    const { userId } = req.body;
    const partyId = parseInt(req.params.partyId);

    console.log('Leave party request:', { userId, partyId });

    // 检查队伍是否存在
    const [partyInfo] = await conn.execute(
      'SELECT leader_id FROM parties WHERE id = ?',
      [partyId]
    );

    if (!partyInfo || partyInfo.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }

    console.log('Party info:', partyInfo[0]);

    // 检查是否是队长
    if (partyInfo[0].leader_id === parseInt(userId)) {
      // 队长离开，解散队伍
      console.log('Leader leaving, disbanding party');
      // 先删除成员，再删除队伍（外键约束）
      await conn.execute('DELETE FROM party_members WHERE party_id = ?', [partyId]);
      await conn.execute('DELETE FROM parties WHERE id = ?', [partyId]);
      res.json({ success: true, message: 'Party disbanded' });
    } else {
      // 普通成员离开
      console.log('Member leaving party');
      const [result] = await conn.execute(
        'DELETE FROM party_members WHERE party_id = ? AND user_id = ?',
        [partyId, parseInt(userId)]
      );

      console.log('Delete result:', result);

      if (result.affectedRows === 0) {
        return res.json({ success: false, message: 'Not a member of this party' });
      }

      res.json({ success: true, message: 'Left party' });
    }
  } catch (e) {
    console.error('Leave party error:', e);
    res.json({ success: false, message: 'Failed to leave party' });
  } finally {
    conn.release();
  }
});

// 通过邀请码加入队伍
app.post('/api/parties/join-by-code', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, characterId, inviteCode } = req.body;

    console.log('Join by code request:', { userId, characterId, inviteCode });

    // 验证邀请码格式（格式：PD{partyId}）
    if (!inviteCode || !inviteCode.startsWith('PD')) {
      return res.json({ success: false, message: 'Invalid invite code format' });
    }

    // 解析队伍ID
    const partyIdStr = inviteCode.substring(2);
    const partyId = parseInt(partyIdStr);

    if (isNaN(partyId) || partyId <= 0) {
      return res.json({ success: false, message: 'Invalid invite code' });
    }

    // 检查队伍是否存在
    const [partyInfo] = await conn.execute(
      'SELECT id, max_members, name FROM parties WHERE id = ?',
      [partyId]
    );

    if (!partyInfo || partyInfo.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }

    // 检查用户是否已在队伍
    const [inParty] = await conn.execute(
      'SELECT pm.*, p.name as party_name FROM party_members pm JOIN parties p ON pm.party_id = p.id WHERE pm.user_id = ?',
      [userId]
    );

    if (inParty.length > 0) {
      return res.json({ success: false, message: 'Already in a party', currentParty: inParty[0] });
    }

    // 检查队伍人数
    const [memberCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM party_members WHERE party_id = ?',
      [partyId]
    );

    if (memberCount[0].count >= partyInfo[0].max_members) {
      return res.json({ success: false, message: 'Party is full' });
    }

    // 加入队伍
    await conn.execute(
      'INSERT INTO party_members (party_id, user_id, character_id) VALUES (?, ?, ?)',
      [partyId, userId, characterId]
    );

    res.json({
      success: true,
      message: 'Joined party successfully',
      partyId: partyId,
      partyName: partyInfo[0].name
    });
  } catch (e) {
    console.error('Join by code error:', e);
    res.json({ success: false, message: 'Failed to join party' });
  } finally {
    conn.release();
  }
});

// 踢出成员（仅队长）
app.post('/api/parties/:partyId/kick', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, targetUserId } = req.body;
    const partyId = parseInt(req.params.partyId);

    console.log('Kick member request:', { userId, targetUserId, partyId });

    // 检查队伍是否存在
    const [partyInfo] = await conn.execute(
      'SELECT leader_id FROM parties WHERE id = ?',
      [partyId]
    );

    if (!partyInfo || partyInfo.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }

    // 验证队长权限
    if (partyInfo[0].leader_id !== parseInt(userId)) {
      return res.json({ success: false, message: 'Only party leader can kick members' });
    }

    // 防止队长踢出自己
    if (parseInt(targetUserId) === parseInt(userId)) {
      return res.json({ success: false, message: 'Cannot kick yourself. Use leave party instead.' });
    }

    // 检查目标是否在队伍中
    const [targetMember] = await conn.execute(
      'SELECT * FROM party_members WHERE party_id = ? AND user_id = ?',
      [partyId, parseInt(targetUserId)]
    );

    if (!targetMember || targetMember.length === 0) {
      return res.json({ success: false, message: 'Target user not in party' });
    }

    // 踢出成员
    await conn.execute(
      'DELETE FROM party_members WHERE party_id = ? AND user_id = ?',
      [partyId, parseInt(targetUserId)]
    );

    // 通过WebSocket通知队伍成员
    if (app.broadcastPartyUpdate) {
      app.broadcastPartyUpdate(partyId, 'member_kicked', {
        kickedUserId: targetUserId,
        kickerUserId: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Member kicked successfully' });
  } catch (e) {
    console.error('Kick member error:', e);
    res.json({ success: false, message: 'Failed to kick member' });
  } finally {
    conn.release();
  }
});

// 转让队长（仅队长）
app.post('/api/parties/:partyId/transfer', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId, newLeaderUserId } = req.body;
    const partyId = parseInt(req.params.partyId);

    console.log('Transfer leader request:', { userId, newLeaderUserId, partyId });

    // 检查队伍是否存在
    const [partyInfo] = await conn.execute(
      'SELECT leader_id FROM parties WHERE id = ?',
      [partyId]
    );

    if (!partyInfo || partyInfo.length === 0) {
      return res.json({ success: false, message: 'Party not found' });
    }

    // 验证队长权限
    if (partyInfo[0].leader_id !== parseInt(userId)) {
      return res.json({ success: false, message: 'Only party leader can transfer leadership' });
    }

    // 不能转让给自己
    if (parseInt(newLeaderUserId) === parseInt(userId)) {
      return res.json({ success: false, message: 'Already the leader' });
    }

    // 检查新队长是否在队伍中
    const [newLeader] = await conn.execute(
      'SELECT * FROM party_members WHERE party_id = ? AND user_id = ?',
      [partyId, parseInt(newLeaderUserId)]
    );

    if (!newLeader || newLeader.length === 0) {
      return res.json({ success: false, message: 'Target user not in party' });
    }

    // 更新队长
    await conn.execute(
      'UPDATE parties SET leader_id = ? WHERE id = ?',
      [parseInt(newLeaderUserId), partyId]
    );

    // 通过WebSocket通知队伍成员
    if (app.broadcastPartyUpdate) {
      app.broadcastPartyUpdate(partyId, 'leader_transferred', {
        oldLeaderId: userId,
        newLeaderId: newLeaderUserId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Leadership transferred successfully' });
  } catch (e) {
    console.error('Transfer leader error:', e);
    res.json({ success: false, message: 'Failed to transfer leadership' });
  } finally {
    conn.release();
  }
});

// 获取队伍列表

