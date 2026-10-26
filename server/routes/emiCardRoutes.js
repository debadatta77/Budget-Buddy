import { Router } from 'express';
import {
  getEmiCards,
  createEmiCard,
  updateEmiCard,
  deleteEmiCard,
  calculateAmortization
} from '../controllers/emiCardController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

// Public amortization calculation studio endpoint (can be tested without login)
router.post('/calculate', calculateAmortization);

// Protected routes for managing user's saved EMI cards
router.use(protect);
router.get('/', getEmiCards);
router.post('/', createEmiCard);
router.put('/:id', updateEmiCard);
router.delete('/:id', deleteEmiCard);

export default router;
