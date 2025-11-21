import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { bookingRouter } from './routes/bookings';
import { availabilityRouter } from './routes/availability';

dotenv.config();
const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/bookings', bookingRouter);
app.use('/availability', availabilityRouter);

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
