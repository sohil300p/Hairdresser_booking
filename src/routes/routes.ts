import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';

const router = Router();

// Health Check Route
router.get('/health', healthCheck);

export default router;

