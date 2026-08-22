import { Router } from 'express';
import { addLeaveDay, removeLeaveDay } from '../controllers/admin.controller.js';
import { verifyJWT, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.use(requireRole(['ADMIN'])); // Ensure only ADMIN can access these routes

router.route('/doctors/:id/leave').post(addLeaveDay);
router.route('/doctors/:id/leave/:leaveId').delete(removeLeaveDay);

export default router;
