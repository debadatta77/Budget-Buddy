import express from 'express';
import { adminProtect } from '../middleware/authMiddleware.js';
import {
  adminLogin,
  getAdminOverview,
  getAdminSpendingBreakdown,
  getAdminUsers,
  getAdminTopCustomers,
  getAdminLiveFeed,
  getAdminFeedbackSheet,
  updateAdminFeedbackStatus,
  deleteAdminFeedback,
  createFeedbackPublic,
  purgeSampleFeedback
} from '../controllers/adminController.js';

const router = express.Router();

// Public Admin Authentication & Feedback Submission
router.post('/login', adminLogin);
router.post('/feedback-public', createFeedbackPublic);

// Protected Admin Endpoints
router.get('/overview', adminProtect, getAdminOverview);
router.get('/spending-breakdown', adminProtect, getAdminSpendingBreakdown);
router.get('/users', adminProtect, getAdminUsers);
router.get('/top-customers', adminProtect, getAdminTopCustomers);
router.get('/live-feed', adminProtect, getAdminLiveFeed);
router.get('/feedback-sheet', adminProtect, getAdminFeedbackSheet);
router.patch('/feedback-sheet/:id', adminProtect, updateAdminFeedbackStatus);
router.put('/feedback-sheet/:id', adminProtect, updateAdminFeedbackStatus);
router.delete('/feedback-sheet/purge/samples', adminProtect, purgeSampleFeedback);
router.delete('/feedback-sheet/:id', adminProtect, deleteAdminFeedback);

export default router;
