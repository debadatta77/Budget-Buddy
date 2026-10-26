import { Router } from 'express';
import {
  getReportSettings,
  updateReportSettings,
  previewStatement,
  sendStatementNow,
  triggerAutoScheduler
} from '../controllers/reportController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/settings', protect, getReportSettings);
router.put('/settings', protect, updateReportSettings);
router.get('/preview', protect, previewStatement);
router.post('/send-now', optionalAuth, sendStatementNow);
router.post('/trigger-scheduler', triggerAutoScheduler);

export default router;
