import { Router } from 'express';
import { getDoctors, getAvailability } from '../controllers/doctor.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getDoctors);
router.route('/:id/availability').get(getAvailability);

export default router;
