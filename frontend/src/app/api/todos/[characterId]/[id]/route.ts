import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 完成 Todo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;
    
    // 获取 todo
    const [todos] = await connection.execute(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );
    
    const todoList = todos as any[];
    if (todoList.length === 0) {
      return NextResponse.json({ success: false, message: '任务不存在' });
    }
    
    const todo = todoList[0];
    if (todo.completed) {
      return NextResponse.json({ success: false, message: '任务已完成' });
    }

    // 开启事务
    await connection.beginTransaction();

    // 更新 todo 状态
    await connection.execute(
      'UPDATE todos SET completed = 1, completed_at = NOW() WHERE id = ?',
      [id]
    );

    // 获取角色
    const [chars] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [todo.character_id]
    );
    
    const charList = chars as any[];
    const character = charList[0];

    // 计算总经验
    const totalExp = todo.str_exp + todo.dex_exp + todo.con_exp + todo.int_exp + todo.wis_exp + todo.cha_exp;
    let newExp = character.exp + totalExp;
    let newLevel = character.level;
    let hpGain = Math.floor(Math.random() * 3) + 1; // 升级获得1-3点HP

    // 升级逻辑：每100经验升一级
    while (newExp >= 100) {
      newExp -= 100;
      newLevel++;
    }

    // 更新角色属性
    const [updateResult] = await connection.execute(
      `UPDATE characters SET 
        exp = ?, 
        level = ?,
        hp = LEAST(max_hp + ?, hp + ?),
        max_hp = max_hp + ?,
        str = str + ?,
        dex = dex + ?,
        con = con + ?,
        int_score = int_score + ?,
        wis = wis + ?,
        cha = cha + ?
      WHERE id = ?`,
      [
        newExp, 
        newLevel, 
        hpGain, hpGain, hpGain,
        todo.str_exp, todo.dex_exp, todo.con_exp, todo.int_exp, todo.wis_exp, todo.cha_exp,
        character.id
      ]
    );

    // 获取更新后的角色
    const [updatedChars] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [character.id]
    );
    
    const updatedCharacter = (updatedChars as any[])[0];

    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      expGained: totalExp,
      levelUp: newLevel > character.level,
      newLevel: newLevel,
      hpGained: hpGain,
      attributes: {
        str: todo.str_exp,
        dex: todo.dex_exp,
        con: todo.con_exp,
        int: todo.int_exp,
        wis: todo.wis_exp,
        cha: todo.cha_exp
      },
      character: updatedCharacter
    });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ success: false, message: '完成任务失败' });
  } finally {
    connection.release();
  }
}

// 删除 Todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await pool.execute('DELETE FROM todos WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: '删除任务失败' });
  }
}
