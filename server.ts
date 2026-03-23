import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API routers
import authRouter from './server/routes/auth.js';
import eventsRouter from './server/routes/events.js';
import teamsRouter from './server/routes/teams.js';
import membersRouter from './server/routes/members.js';
import queriesRouter from './server/routes/queries.js';
import usersRouter from './server/routes/users.js';
import announcementsRouter from './server/routes/announcements.js';
import eventRegistrationsRouter from './server/routes/eventRegistrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/teams', teamsRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/queries', queriesRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/event-registrations', eventRegistrationsRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
