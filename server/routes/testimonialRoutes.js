import { Router } from 'express';
import { getTopTestimonials, createTestimonial } from '../controllers/testimonialController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getTopTestimonials);
router.post('/', optionalAuth, createTestimonial);

export default router;
