import { Router } from 'express';
import { getLiveTelemetry } from '../controllers/telemetryController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/live', getLiveTelemetry);

export default router;
