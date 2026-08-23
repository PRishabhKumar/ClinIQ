import { Router } from 'express';
import { register, login, refresh, logout, googleLogin, googleCallback } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Google Auth & Calendar Linking
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

export default router;
