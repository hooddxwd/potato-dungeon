import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 获取 Todo 列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    
    const [todos] = await pool.execute(
      'SELECT * FROM todos WHERE character_id = ? ORDER BY created_at DESC',
      [characterId]
    );

    return NextResponse.json({ success: true, todos });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取任务失败' });
  }
}

// 创建 Todo
export async function POST(request: NextRequest) {
  try {
    const { characterId, title, description, strExp, dexExp, conExp, intExp, wisExp, chaExp } = await request.json();

    const [result] = await pool.execute(
      `INSERT INTO todos (character_id, title, description, str_exp, dex_exp, con_exp, int_exp, wis_exp, cha_exp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [characterId, title, description || '', strExp || 0, dexExp || 0, conExp || 0, intExp || 0, wisExp || 0, chaExp || 0]
    );

    return NextResponse.json({ success: true, todoId: (result as any).insertId });
  } catch (error) {
    return NextResponse.json({ success: false, message: '创建任务失败' });
  }
}
