import { Router } from "express";
import {
  deleteReferral,
  getReferrals,
  postReferral,
  updateReferral,
} from "../controllers/referral.controller.js";
import { authorize, verifyUser } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/referral").post(verifyUser,authorize("staff"),upload.any(), postReferral); //upload.array("image",10)=> for fixed no

router.route("/getReferralById/:userId").get(verifyUser, getReferrals);

router.route("/updateReferral/:id").put(verifyUser,authorize("staff"), upload.any(), updateReferral);

router.route("/deleteReferral/:id").delete(verifyUser,authorize("staff"), deleteReferral);

export default router;
