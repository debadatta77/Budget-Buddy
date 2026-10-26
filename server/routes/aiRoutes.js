import { Router } from 'express';
import { chatWithAdvisor } from '../controllers/aiController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/chat', chatWithAdvisor);

export default router;
