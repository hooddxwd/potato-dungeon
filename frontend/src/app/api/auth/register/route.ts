import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    const insertId = (result as any).insertId;

    // 创建角色
    const [charResult] = await pool.execute(
      'INSERT INTO characters (user_id, name) VALUES (?, ?)',
      [insertId, username]
    );

    return NextResponse.json({
      success: true,
      userId: insertId,
      characterId: (charResult as any).insertId
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: '用户名已存在' });
    }
    return NextResponse.json({ success: false, message: '注册失败' });
  }
}
