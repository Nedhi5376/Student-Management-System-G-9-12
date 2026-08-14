import { Router } from 'express';
import { subscribeToEvents } from '../controllers/events.controller.js';
import { verifyJWTQuery } from '../middlewares/verifyJWTQuery.js';

export const eventsRouter = Router();

eventsRouter.get('/', verifyJWTQuery, subscribeToEvents);