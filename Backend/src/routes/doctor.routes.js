import { Router } from 'express';
import { getDoctors, getAvailability, getMyAppointments } from '../controllers/doctor.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getDoctors);
router.route('/:id/availability').get(getAvailability);

// Doctors only
router.get('/me/appointments', requireRole(['DOCTOR']), getMyAppointments);

export default router;
