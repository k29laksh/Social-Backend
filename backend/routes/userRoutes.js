import express from "express";
import {
  UserLogin,
  UserLogout,
  UserSignup,
} from "../controllers/user.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.js";
const router = express.Router();

router.route("/signup").post(UserSignup);
router.route("/login").post(UserLogin);
router.route("/logout").post(authMiddleware, UserLogout);
router.route("/update-profile",upload.fields[{'name':'image',maxCount:1},{'name':'coverImage',maxCount:1}]).post(authMiddleware, UserLogout);
export default router;
