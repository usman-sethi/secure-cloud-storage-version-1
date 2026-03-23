import express from 'express';
import authRouter from '../server/routes/auth.js';
import eventsRouter from '../server/routes/events.js';
import teamsRouter from '../server/routes/teams.js';
import membersRouter from '../server/routes/members.js';
import queriesRouter from '../server/routes/queries.js';
import usersRouter from '../server/routes/users.js';
import announcementsRouter from '../server/routes/announcements.js';
import eventRegistrationsRouter from '../server/routes/eventRegistrations.js';

const app = express();

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
  res.json({ status: 'ok', environment: 'vercel' });
});

export default app;
