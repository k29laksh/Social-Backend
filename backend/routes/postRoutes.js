import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/post.controllers.js";

const router=Router();

router.route("/create").post(upload.single('image'),authMiddleware,createPost)

export default router;