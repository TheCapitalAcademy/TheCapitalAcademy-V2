import { createServer } from 'http';
import express from 'express';
import userRouter from './server/routes/users.js';
import commonRouter from './server/routes/common.js';
import reviewRouter from './server/routes/review.js';
import { errorHandler } from './server/middleware/error.middleware.js';
import mongoose from 'mongoose';
import cors from 'cors';
import { initCronJobs } from './server/corn/index.js';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import courseRouter from './server/routes/course.js';
import referalRouter from './server/routes/referal.js';
import PurchaseRouter from './server/routes/purchases.js';
import progressRouter from './server/routes/userProgress.js';
import mcqRouter from './server/routes/mcq.js';
import plannerRouter from './server/routes/planner.js';
import reportRouter from './server/routes/report.js';
import seriesRouter from './server/routes/series/series.js';
import paymentRouter from './server/routes/series/payments.js';
import testRouter from './server/routes/series/tests.js';
import aiExplanationRouter from './server/routes/aiExplanation.js';
import aiSettingsRouter from './server/routes/aiSettings.js';
import aiChatRouter from './server/routes/aiChat.js';
import capyAiChatRouter from './server/routes/capyAiChat.js';
dotenv.config({
    path: "./.env.local",
}); // 👈 
const port = parseInt(process.env.PORT || '8080', 10);
const expressApp = express();
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};
connectMongoDB();
initCronJobs();
// CORS configuration
expressApp.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
expressApp.use(express.json());
expressApp.use(cookieParser());
//routes start from here
expressApp.use("/api/v1/users", userRouter);
expressApp.use("/api/v1/common", commonRouter);
expressApp.use("/api/v1/review", reviewRouter);
expressApp.use("/api/v1/course", courseRouter);
expressApp.use("/api/v1/referral", referalRouter);
expressApp.use("/api/v1/purchase", PurchaseRouter);
expressApp.use("/api/v1/progress", progressRouter);
expressApp.use("/api/v1/mcq", mcqRouter);
expressApp.use("/api/v1/planner", plannerRouter);
expressApp.use("/api/v1/report", reportRouter);
// series routes
expressApp.use("/api/v1/series", seriesRouter);
expressApp.use("/api/v1/payment", paymentRouter);
expressApp.use("/api/v1/test", testRouter);
// AI explanation routes
expressApp.use("/api/v1/explanation", aiExplanationRouter);
expressApp.use("/api/v1/ai-settings", aiSettingsRouter);
expressApp.use("/api/v1/ai-chat", aiChatRouter);
expressApp.use("/api/v1/capy-ai", capyAiChatRouter);
// error handler middleware
expressApp.use(errorHandler);
const httpServer = createServer(expressApp);
// setupSocket(httpServer);
httpServer.listen(port, () => {
    console.log(`> Backend API Server listening at http://localhost:${port}`);
});
