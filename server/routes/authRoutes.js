import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';

const router = Router();

/**
 * Public Authentication Routes
 */
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
