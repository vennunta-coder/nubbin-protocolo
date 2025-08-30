import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../models/db.js';

export async function register(req, res){
  try{
    const { name, age, location, password } = req.body;
    if(!name || !password) return res.status(400).json({ error: 'name and password required' });
    const hash = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    try{
      const user = await client.query('INSERT INTO users(name, age, location, password_hash) VALUES($1,$2,$3,$4) RETURNING id,name,age,location', [name, age||null, location||null, hash]);
      const token = jwt.sign({ id: user.rows[0].id, name }, process.env.JWT_SECRET || 'changeme', { expiresIn: '30d' });
      // inicia progresso em 1
      await client.query('INSERT INTO progress(user_id, level) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING', [user.rows[0].id, 1]);
      return res.json({ token, user: user.rows[0] });
    } finally {
      client.release();
    }
  }catch(e){
    if(e.code === '23505') return res.status(409).json({ error: 'name already exists' });
    return res.status(500).json({ error: 'server error' });
  }
}

export async function login(req, res){
  try{
    const { name, password } = req.body;
    if(!name || !password) return res.status(400).json({ error: 'name and password required' });
    const client = await pool.connect();
    try{
      const q = await client.query('SELECT * FROM users WHERE name=$1', [name]);
      if(q.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });
      const ok = await bcrypt.compare(password, q.rows[0].password_hash);
      if(!ok) return res.status(401).json({ error: 'invalid credentials' });
      const token = jwt.sign({ id: q.rows[0].id, name }, process.env.JWT_SECRET || 'changeme', { expiresIn: '30d' });
      return res.json({ token, user: { id: q.rows[0].id, name: q.rows[0].name, location: q.rows[0].location } });
    } finally { client.release(); }
  }catch(e){ return res.status(500).json({ error: 'server error' }); }
}
