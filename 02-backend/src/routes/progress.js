import { Router } from 'express';
import { saveProgress, loadProgress } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/auth.js';
const r = Router();
r.post('/save', requireAuth, saveProgress);
r.get('/load', requireAuth, loadProgress);
export default r;
