import { Router } from 'express';
import { getBudget, updateBudget } from '../controllers/budgetController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getBudget);
router.put('/', updateBudget);

export default router;
