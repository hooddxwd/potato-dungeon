const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'potato_dungeon',
    waitForConnections: true,
    connectionLimit: 10
  });

  const conn = await pool.getConnection();
  try {
    const partyId = 16;
    const userId = 1;
    
    const [partyInfo] = await conn.execute(
      'SELECT leader_id FROM parties WHERE id = ?',
      [partyId]
    );

    console.log('Party info:', partyInfo);

    if (!partyInfo || partyInfo.length === 0) {
      console.log('Party not found');
      return;
    }

    console.log('Leader ID:', partyInfo[0].leader_id, 'User ID:', userId);
    console.log('Equal?', partyInfo[0].leader_id === parseInt(userId));

    if (partyInfo[0].leader_id === parseInt(userId)) {
      console.log('Leader leaving, disbanding party');
      await conn.execute('DELETE FROM parties WHERE id = ?', [partyId]);
      await conn.execute('DELETE FROM party_members WHERE party_id = ?', [partyId]);
      console.log('Party disbanded successfully');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    conn.release();
    await pool.end();
  }
}

test();
