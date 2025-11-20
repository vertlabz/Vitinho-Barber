import { Router } from 'express';
import { createBookingHandler, listBookingsHandler } from '../controllers/bookings';

export const bookingRouter = Router();
bookingRouter.post('/', createBookingHandler);
bookingRouter.get('/', listBookingsHandler);
