const express = require("express");

const router = express.Router();

const missionController = require("../controllers/missionController");

const {
    createMissionRoute,
    getMissionRoute,
    updateMissionRoute
} = require("../controllers/missionRouteController");

// ========================================
// Mission
// ========================================

// 建立 Mission
router.post("/", missionController.createMission);

// 取得 Mission 列表
router.get("/", missionController.getAllMissions);

// 更新 Mission
router.patch("/:id", missionController.updateMission);

// 更新 Mission Status
router.patch("/:id/status", missionController.updateMissionStatus);

// 取得單一 Mission
router.get("/:id", missionController.getMissionById);

// ========================================
// Create Mission From Template
// ========================================

router.post(
    "/from-template/:templateId",
    missionController.createMissionFromTemplate
);

// ========================================
// Mission Final Route
// ========================================

// 建立 Final Route
router.post("/:id/route", createMissionRoute);

// 取得 Final Route
router.get("/:id/route", getMissionRoute);

// 更新 Final Route
router.patch("/:id/route", updateMissionRoute);

module.exports = router;