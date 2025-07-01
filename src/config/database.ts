import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'jus_scraper',
  user: process.env.DB_USER || 'jus_user',
  password: process.env.DB_PASSWORD || 'jus_password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(config);

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err: Error) => {
  console.error('❌ Erro no PostgreSQL:', err);
});

export { pool };
export default pool;