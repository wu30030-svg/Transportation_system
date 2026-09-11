const express = require("express");

const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", authController.login);

// JWT 身份驗證測試
router.use(require("./authTest"));

module.exports = router;
