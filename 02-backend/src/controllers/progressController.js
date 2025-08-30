import { pool } from '../models/db.js';

export async function saveProgress(req, res){
  try{
    const { level } = req.body;
    if(!level) return res.status(400).json({ error: 'level required' });
    await pool.query('INSERT INTO progress(user_id, level) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET level=EXCLUDED.level, updated_at=NOW()', [req.user.id, level]);
    return res.json({ ok: true });
  }catch(e){ return res.status(500).json({ error: 'server error' }); }
}

export async function loadProgress(req, res){
  try{
    const q = await pool.query('SELECT level FROM progress WHERE user_id=$1', [req.user.id]);
    const level = q.rowCount ? q.rows[0].level : 1;
    return res.json({ level });
  }catch(e){ return res.status(500).json({ error: 'server error' }); }
}
