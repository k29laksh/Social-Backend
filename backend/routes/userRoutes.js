import express from 'express'
import { UserSignup } from '../controllers/user.controllers.js';
const router = express.Router();

router.route('/signup').post(UserSignup);
export default router;