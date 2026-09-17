const express = require("express");

const authController = require("../controllers/authController");
const { authenticateToken } = require("../../../middleware/authMiddleware");

const router = express.Router();


// ========================================
// Login
// ========================================

router.post(
    "/login",
    authController.login
);


// ========================================
// Logout
// ========================================

router.post(
    "/logout",
    authenticateToken,
    authController.logout
);


module.exports = router;