const express = require("express");
const {validateBody, authenticate, updateStatus, upload, uploadChecker} = require("../../middlewares");
const {schemas} = require("../../models/user");
const ctrl = require("../../controllers/auth");

const router = express.Router();

// signup
router.post("/register", validateBody(schemas.registerSchema), ctrl.register); 


// Verify
router.get("/verify/:verificationToken", ctrl.verifyEmail);


// Re-verify
router.post("/verify", updateStatus(schemas.userEmailSchema, "missing required field email"), ctrl.resendVerify);


// signin o login
router.post("/login", validateBody(schemas.loginSchema), ctrl.login);


//  Current User
router.get("/current", authenticate, ctrl.getCurrent);


// Logout
router.post("/logout", authenticate, ctrl.logout);


// Update Subscription
router.patch("/", authenticate, updateStatus(schemas.updateSubscriptionSchema, "missing field subscription"), ctrl.updateSubscription);


// Update Avatar
router.patch("/avatars", authenticate, upload.single("avatar"), uploadChecker, ctrl.updateAvatar);


module.exports = router;
