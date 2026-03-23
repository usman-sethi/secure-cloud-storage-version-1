import express from 'express';
import serverless from 'serverless-http';

// Import API routers
import authRouter from '../../server/routes/auth.js';
import eventsRouter from '../../server/routes/events.js';
import teamsRouter from '../../server/routes/teams.js';
import membersRouter from '../../server/routes/members.js';
import queriesRouter from '../../server/routes/queries.js';
import usersRouter from '../../server/routes/users.js';
import announcementsRouter from '../../server/routes/announcements.js';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
const router = express.Router();
router.use('/auth', authRouter);
router.use('/events', eventsRouter);
router.use('/teams', teamsRouter);
router.use('/members', membersRouter);
router.use('/queries', queriesRouter);
router.use('/users', usersRouter);
router.use('/announcements', announcementsRouter);

// Mount router at root for the serverless function
app.use('/', router);

// Configure serverless-http with the Netlify function base path
export const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});
