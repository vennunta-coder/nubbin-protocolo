import app from './app.js';
import authRouter from './routes/auth.js';
import progressRouter from './routes/progress.js';
import rankingRouter from './routes/ranking.js';
import { initDb } from './models/db.js';

const PORT = process.env.PORT || 4000;

app.use('/auth', authRouter);
app.use('/progress', progressRouter);
app.use('/ranking', rankingRouter);

initDb().then(() => {
  app.listen(PORT, () => console.log(`[Nubbin API] Online na porta ${PORT}`));
}).catch((e) => {
  console.error('DB init error:', e);
  process.exit(1);
});
