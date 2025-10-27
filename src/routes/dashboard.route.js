import {Router} from "express"
import {
    getDashboard, getDashboardById,
    updateDashboard, updateDashboardById,
     deleteReferral, getAdminDashboardSummary,  
     restoreReferral
     }from "../controllers/dashboard.controller.js";
import { authorize, verifyUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/getDashboard").get(verifyUser, getDashboard);
router.route("/getDashboardById/:userId").get(verifyUser, authorize("admin"), getDashboardById);

router.route("/updateDashboard").patch(verifyUser, updateDashboard);
router.route("/updateDashboardById/:userId").patch(verifyUser, authorize("admin"), updateDashboardById);

router.route("/dashboard/:dashboardId/delete/:referralId").patch(verifyUser, deleteReferral)
router.route("/dashboard/:dashboardId/restore/:referralId").patch(verifyUser, authorize("admin"), restoreReferral)

router.route("/getAdminDashboard").get(verifyUser, authorize("admin"), getAdminDashboardSummary);

export default router;