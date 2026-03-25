import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'potato_dungeon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库表
export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        level INT DEFAULT 1,
        exp INT DEFAULT 0,
        hp INT DEFAULT 10,
        max_hp INT DEFAULT 10,
        gold INT DEFAULT 0,
        str INT DEFAULT 10,
        dex INT DEFAULT 10,
        con INT DEFAULT 10,
        int_score INT DEFAULT 10,
        wis INT DEFAULT 10,
        cha INT DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INT PRIMARY KEY AUTOINCREMENT,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT PRIMARY KEY AUTOINCREMENT,
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
        completed_at DATETIME,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS adventures (
        id INT PRIMARY KEY AUTOINCREMENT,
        character_id INT NOT NULL,
        dungeon_level INT NOT NULL,
        result VARCHAR(50),
        gold_earned INT DEFAULT 0,
        exp_earned INT DEFAULT 0,
        equipment_earned TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      )
    `);

    console.log('✅ 数据库表初始化完成');
  } finally {
    connection.release();
  }
}

export default pool;
