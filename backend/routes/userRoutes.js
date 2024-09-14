import express from "express";
import {
  followUser,
  getAllUsers,
  getUserProfile,
  getUser,
  updateProfile,
  UserLogin,
  UserLogout,
  UserSignup,
  getUserFollowers,
  getUserFollowings,
} from "../controllers/user.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.js";
const router = express.Router();

router.route("/signup").post(UserSignup);
router.route("/login").post(UserLogin);
router.route("/:userId").get(getUser);
router.route("/").get(getAllUsers);
router.route("/logout").post(authMiddleware, UserLogout);
router.route("/follow/:username").post(authMiddleware, followUser);
router.route("/getuserProfile/:username").get(authMiddleware, getUserProfile);
router.route("/getUserFollowers/:username").get(authMiddleware, getUserFollowers);
router.route("/getUserFollowings/:username").get(authMiddleware, getUserFollowings);

router.route("/update-profile/:userId").patch(upload.fields([{name:'image',maxCount:1},{name:'coverImage',maxCount:1}]),authMiddleware, updateProfile);
export default router;
