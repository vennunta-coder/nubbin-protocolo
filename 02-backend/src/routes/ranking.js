import { Router } from 'express';
import { getRanking } from '../controllers/rankingController.js';
const r = Router();
r.get('/', getRanking);
export default r;
