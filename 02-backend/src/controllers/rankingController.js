import { pool } from '../models/db.js';

export async function getRanking(req, res){
  try{
    const q = await pool.query(`
      SELECT u.name, u.location, p.level
      FROM users u
      JOIN progress p ON p.user_id = u.id
      ORDER BY p.level DESC, p.updated_at ASC
      LIMIT 50
    `);
    return res.json(q.rows);
  }catch(e){ return res.status(500).json({ error: 'server error' }); }
}
