import { Router } from 'express';
import { getDoctors } from '../controllers/doctor.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/').get(getDoctors);

export default router;
