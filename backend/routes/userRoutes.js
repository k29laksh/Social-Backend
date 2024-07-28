import express from 'express'
import { UserLogin, UserSignup } from '../controllers/user.controllers.js';
const router = express.Router();

router.route('/signup').post(UserSignup);
router.route('/login').post(UserLogin);
export default router;