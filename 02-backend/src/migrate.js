import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './models/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run(){
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');
  await pool.query(sql);
  console.log('[DB] Schema aplicado com sucesso.');
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
