import { Router } from 'express';
import { healthCheck } from '../Helth/healthController';
import { sendOtpController, verifyOtpController } from '../OTP/otp.controller';
import { refreshTokenController, verifyTokenController, logoutController } from '../auth/auth.controller';

const router = Router();

// Health Check Route
router.get('/health', healthCheck);

// OTP Routes
router.post('/otp/send', sendOtpController);
router.post('/otp/verify', verifyOtpController);

// Authentication Routes
router.post('/auth/refresh-token', refreshTokenController);
router.post('/auth/verify-token', verifyTokenController);
router.post('/auth/logout', logoutController);

export default router;
