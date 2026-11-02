import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middlewares/auth.js';
import systemRouter from './routes/systemRoutes.js';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000; // Local testing default port

// 1. Mandatory Application-Level CORS Configuration (Dynamic Environment Selection)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? "https://softwarewolf.org"  // Production live domain
    : "http://localhost:3000",    // Local development machine domain
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 2. Global Identity Context Parser 
app.use(requireAuth);

// 3. Mount All Your Custom API Routes Under /api
app.use('/api', systemRouter);

// 4. Fallback Status Diagnostic Route
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', contextRole: req.user?.role || 'GUEST' });
});

// 5. Direct Express Listening Block
app.listen(port, () => {
  console.log(`> Standalone SoftwareWolf Express Server live on port ${port}`);
});

export default app;
