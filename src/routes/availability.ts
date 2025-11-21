// src/routes/availability.ts
import { Router } from 'express';
import { getAvailabilityHandler } from '../controllers/availability';

export const availabilityRouter = Router();
availabilityRouter.get('/', getAvailabilityHandler);
