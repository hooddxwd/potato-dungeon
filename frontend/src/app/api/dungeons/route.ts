import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 地城数据
const DUNGEONS: Record<number, any> = {
  1: {
    name: "土豆洞穴",
    recommendedLevel: 1,
    monsters: [
      { name: "史莱姆", hp: 5, ac: 8, str: 2, exp: 10, gold: 5 },
      { name: "蝙蝠", hp: 3, ac: 10, dex: 2, exp: 8, gold: 3 },
      { name: "老鼠", hp: 4, ac: 9, dex: 1, exp: 6, gold: 2 }
    ],
    events: [
      { description: "发现一个宝箱！", type: "treasure", gold: 10, exp: 5 },
      { description: "踩到陷阱！", type: "trap", damage: 2 },
      { description: "发现治疗药水", type: "heal", heal: 3 }
    ]
  },
  2: {
    name: "哥布林营地",
    recommendedLevel: 3,
    monsters: [
      { name: "哥布林", hp: 8, ac: 12, str: 3, exp: 20, gold: 10 },
      { name: "狼", hp: 6, ac: 14, dex: 4, exp: 18, gold: 8 },
      { name: "骷髅兵", hp: 10, ac: 11, str: 4, exp: 25, gold: 12 }
    ],
    events: [
      { description: "发现隐藏的宝藏", type: "treasure", gold: 25, exp: 15 },
      { description: "遭遇陷阱箭雨", type: "trap", damage: 4 },
      { description: "发现恢复圣殿", type: "heal", heal: 5 }
    ]
  },
  3: {
    name: "废弃矿洞",
    recommendedLevel: 5,
    monsters: [
      { name: "矿洞史莱姆", hp: 12, ac: 10, str: 5, exp: 35, gold: 18 },
      { name: "洞穴食人魔", hp: 20, ac: 12, str: 7, exp: 50, gold: 30 },
      { name: "幽灵", hp: 8, ac: 16, int: 5, exp: 40, gold: 20 }
    ],
    events: [
      { description: "发现稀有矿石", type: "treasure", gold: 50, exp: 30 },
      { description: "触发大型陷阱", type: "trap", damage: 8 },
      { description: "发现神秘祭坛", type: "heal", heal: 10 }
    ]
  }
};

// 属性判定 (D20 + 属性调整值)
function abilityCheck(abilityScore: number, difficulty: number = 10): boolean {
  const modifier = Math.floor((abilityScore - 10) / 2);
  const roll = Math.floor(Math.random() * 20) + 1;
  return roll + modifier >= difficulty;
}

// 获取属性调整值
function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// 获取地城列表
export async function GET() {
  const list = Object.entries(DUNGEONS).map(([level, data]) => ({
    level: parseInt(level),
    name: data.name,
    recommendedLevel: data.recommendedLevel
  }));
  return NextResponse.json({ success: true, dungeons: list });
}

// 开始冒险
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { characterId, dungeonLevel } = await request.json();
    
    // 获取角色
    const [chars] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [characterId]
    );
    
    const charList = chars as any[];
    if (charList.length === 0) {
      return NextResponse.json({ success: false, message: '角色不存在' });
    }
    
    const character = charList[0];
    const dungeon = DUNGEONS[dungeonLevel];
    
    if (!dungeon) {
      return NextResponse.json({ success: false, message: '地城不存在' });
    }

    // 检查角色等级
    if (character.level < dungeon.recommendedLevel - 2) {
      return NextResponse.json({ 
        success: false, 
        message: `推荐等级 ${dungeon.recommendedLevel}，你的等级 ${character.level} 可能太低！` 
      });
    }

    // 随机遭遇
    const encounter = Math.random();
    let result: any = {
      type: '',
      description: '',
      damage: 0,
      gold: 0,
      exp: 0,
      equipment: null
    };

    if (encounter < 0.5) {
      // 遭遇怪物
      const monster = dungeon.monsters[Math.floor(Math.random() * dungeon.monsters.length)];
      
      // 玩家攻击
      const attackRoll = Math.floor(Math.random() * 20) + 1;
      const attackBonus = Math.max(getModifier(character.str), getModifier(character.dex));
      const totalAttack = attackRoll + attackBonus;
      
      let monsterHp = monster.hp;
      let playerDamage = 0;
      
      if (totalAttack >= monster.ac) {
        playerDamage = Math.max(1, getModifier(character.str) + Math.floor(Math.random() * 4) + 1);
        monsterHp -= playerDamage;
      }
      
      if (monsterHp > 0) {
        // 怪物反击
        const defRoll = Math.floor(Math.random() * 20) + 1;
        const defBonus = Math.max(getModifier(character.dex), getModifier(character.con));
        const totalDef = defRoll + defBonus;
        
        const monsterAttackRoll = Math.floor(Math.random() * 20) + 1;
        let monsterDamage = 0;
        
        const monsterAtkMod = Math.max(monster.str || 0, monster.dex || 0, monster.int || 0);
        
        if (monsterAttackRoll + Math.floor((monsterAtkMod - 10) / 2) >= totalDef) {
          monsterDamage = Math.max(0, monsterAtkMod - getModifier(character.con) + Math.floor(Math.random() * 4));
        }
        
        result.damage = monsterDamage;
      }
      
      result.type = 'combat';
      result.description = `遭遇 ${monster.name}！`;
      result.monster = monster;
      result.playerDamage = playerDamage;
      result.monsterDefeated = monsterHp <= 0;
      
      if (monsterHp <= 0) {
        result.gold = monster.gold;
        result.exp = monster.exp;
        result.description += ` 击败它获得了 ${monster.gold}金币和 ${monster.exp}经验！`;
      } else {
        result.description += ` 怪物存活，撤退了。`;
      }

    } else if (encounter < 0.8) {
      // 随机事件
      const event = dungeon.events[Math.floor(Math.random() * dungeon.events.length)];
      result.type = event.type;
      result.description = event.description;
      
      if (event.type === 'treasure') {
        result.gold = event.gold;
        result.exp = event.exp;
      } else if (event.type === 'trap') {
        if (abilityCheck(character.dex, 12)) {
          result.description += " 你敏捷地躲开了！";
          result.damage = 0;
        } else {
          result.damage = event.damage;
          result.description += ` 受到 ${event.damage} 点伤害！`;
        }
      } else if (event.type === 'heal') {
        result.heal = event.heal;
      }
    } else {
      result.type = 'peaceful';
      result.description = "地城一片平静，什么都没发生。你获得了少许经验。";
      result.exp = 5;
    }

    await connection.beginTransaction();

    // 更新角色状态
    let newHp = character.hp - result.damage;
    if (result.heal) {
      newHp = Math.min(character.max_hp, newHp + result.heal);
    }
    
    const newGold = character.gold + result.gold;
    let newExp = character.exp + result.exp;
    let newLevel = character.level;
    let hpGain = 0;

    while (newExp >= 100) {
      newExp -= 100;
      newLevel++;
      hpGain += Math.floor(Math.random() * 3) + 1;
    }

    if (newLevel > character.level) {
      newHp = Math.min(character.max_hp + hpGain, newHp + hpGain);
    }

    await connection.execute(
      `UPDATE characters SET 
        hp = ?,
        gold = ?,
        exp = ?,
        level = ?,
        max_hp = max_hp + ?
      WHERE id = ?`,
      [newHp, newGold, newExp, newLevel, hpGain, characterId]
    );

    // 记录冒险
    await connection.execute(
      `INSERT INTO adventures (character_id, dungeon_level, result, gold_earned, exp_earned)
       VALUES (?, ?, ?, ?, ?)`,
      [characterId, dungeonLevel, result.type, result.gold, result.exp]
    );

    // 获取更新后的角色
    const [updatedChars] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [characterId]
    );
    
    const updatedCharacter = (updatedChars as any[])[0];

    await connection.commit();

    return NextResponse.json({
      success: true,
      result,
      character: updatedCharacter,
      levelUp: newLevel > character.level
    });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ success: false, message: '冒险失败' });
  } finally {
    connection.release();
  }
}
