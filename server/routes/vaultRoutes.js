import { Router } from 'express';
import {
  getVault,
  depositVault,
  withdrawVault,
  updateVaultSettings
} from '../controllers/vaultController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/', getVault);
router.post('/deposit', depositVault);
router.post('/withdraw', withdrawVault);
router.put('/settings', updateVaultSettings);

export default router;
