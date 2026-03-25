import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    const userList = users as any[];
    if (userList.length === 0) {
      return NextResponse.json({ success: false, message: '用户名或密码错误' });
    }

    const user = userList[0];

    // 获取角色
    const [chars] = await pool.execute(
      'SELECT * FROM characters WHERE user_id = ?',
      [user.id]
    );

    const charList = chars as any[];
    const character = charList.length > 0 ? charList[0] : null;

    return NextResponse.json({ success: true, user, character });
  } catch (error) {
    return NextResponse.json({ success: false, message: '登录失败' });
  }
}
