import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import userRoutes from './routes/userRoutes.js';
app.use('/api/users', userRoutes);

import flightRoutes from './routes/flightRoutes.js';
app.use('/api/flights', flightRoutes);

import airlineRoutes from './routes/airlineRoutes.js';
app.use('/api/airlines', airlineRoutes);

import ticketRoutes from './routes/ticketRoutes.js';

app.use('/api/tickets', ticketRoutes);

import classRoutes from './routes/classRoutes.js';
app.use('/api/classes', classRoutes);

import paymentRoutes from './routes/paymentRoutes.js';
app.use('/api/payments', paymentRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
