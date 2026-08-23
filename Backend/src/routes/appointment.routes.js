import { Router } from 'express';
import { holdSlot, confirmSlot, submitSymptoms, getMyAppointments, cancelMyAppointment, completeAppointment } from '../controllers/appointment.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

// Patients only
router.get('/', requireRole(['PATIENT']), getMyAppointments);
router.post('/hold', requireRole(['PATIENT']), holdSlot);
router.post('/:id/confirm', requireRole(['PATIENT']), confirmSlot);
router.post('/:id/symptoms', requireRole(['PATIENT']), submitSymptoms);
router.post('/:id/cancel', requireRole(['PATIENT']), cancelMyAppointment);

// Doctors only
router.post('/:id/complete', requireRole(['DOCTOR']), completeAppointment);

export default router;
