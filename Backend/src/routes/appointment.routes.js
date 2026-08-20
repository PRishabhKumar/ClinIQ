import { Router } from 'express';
import { holdSlot, confirmSlot, submitSymptoms } from '../controllers/appointment.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

// Patients only
router.post('/hold', requireRole(['PATIENT']), holdSlot);
router.post('/:id/confirm', requireRole(['PATIENT']), confirmSlot);
router.post('/:id/symptoms', requireRole(['PATIENT']), submitSymptoms);

export default router;
