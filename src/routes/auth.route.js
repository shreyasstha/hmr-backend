import { Router } from "express";
import { login, logout, refreshAccessToken, register } from "../controllers/auth.controller.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refreshToken").post(refreshAccessToken)
router.route("/logout").post(logout)

export default router;