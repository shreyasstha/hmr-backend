import { Router } from "express";
import { login, logout, refreshAccessToken, register, verifyEmail, verifyLoginOTP } from "../controllers/auth.controller.js";
import { sendLoginOTPEmail } from "../utils/mailer.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refreshToken").post(refreshAccessToken)
router.route("/verifyEmail").get(verifyEmail)
router.route("/sendLoginOTP").post(sendLoginOTPEmail)
router.route("/verifyLoginOTP").post(verifyLoginOTP)
router.route("/logout").post(logout)

export default router;