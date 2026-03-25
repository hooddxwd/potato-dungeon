import { initDatabase } from './src/lib/db';

async function bootstrap() {
  console.log('🚀 初始化数据库...');
  await initDatabase();
  console.log('✅ 启动完成！');
}

bootstrap().catch(console.error);
