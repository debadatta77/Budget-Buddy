import { Router } from 'express';
import { getProfile, updateProfile, linkBankAccount } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect); // All user profile endpoints require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/bank-accounts', linkBankAccount);

export default router;
