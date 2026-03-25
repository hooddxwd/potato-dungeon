import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [chars] = await pool.execute(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    );

    const charList = chars as any[];
    if (charList.length === 0) {
      return NextResponse.json({ success: false, message: '角色不存在' });
    }

    const character = charList[0];

    // 获取装备
    const [equipment] = await pool.execute(
      'SELECT * FROM equipment WHERE character_id = ?',
      [id]
    );

    return NextResponse.json({ success: true, character, equipment });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取角色失败' });
  }
}
