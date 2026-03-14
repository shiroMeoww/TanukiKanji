import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tanuki_user:tanuki_pass@localhost:5432/tanuki_kanji',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  const release = client.release.bind(client);
  
  // monkey patch the release method to log
  client.release = () => {
    console.log('client released');
    return release();
  };
  
  return client;
}

export default pool;
