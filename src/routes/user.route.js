import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
} from "../controllers/user.controllers.js";
import { authorize, verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/getAllUsers").get(verifyUser, authorize("admin"), getAllUsers);

router.route("/getUserById/:id").get(verifyUser, getUserById);

//get user profile without id
router.route("/me").get(verifyUser, getProfile);

router.route("/updateUser/:id").put(verifyUser, updateUser);
router.route("/deleteUser/:id").delete(verifyUser, authorize("admin"), deleteUser);

export default router;
