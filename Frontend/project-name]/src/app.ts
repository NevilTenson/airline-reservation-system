import express from 'express';
import { SomeType } from './types/index';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware and configurations can be set up here
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});