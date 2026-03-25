-- 创建土豆地城专用数据库用户
-- 在 MySQL 命令行或工具中运行此脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS potato_dungeon;

-- 创建专用用户
CREATE USER IF NOT EXISTS 'potato_user'@'localhost' IDENTIFIED BY 'potato_password_123';

-- 授予权限
GRANT ALL PRIVILEGES ON potato_dungeon.* TO 'potato_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户信息
SELECT 'Database user created successfully!' AS message;
SHOW GRANTS FOR 'potato_user'@'localhost';
