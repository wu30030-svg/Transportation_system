const express = require("express");

const router = express.Router();

const missionTemplateController =
    require("../controllers/missionTemplateController");

const missionTemplateRouteController =
    require("../controllers/missionTemplateRouteController");


// ========================================
// Mission Template
// ========================================

// 建立 Mission Template
router.post(
    "/",
    missionTemplateController.createTemplate
);


// 取得所有 Mission Templates
router.get(
    "/",
    missionTemplateController.getAllTemplates
);


// 更新 Mission Template
router.patch(
    "/:id",
    missionTemplateController.updateTemplate
);


// 刪除 Mission Template
router.delete(
    "/:id",
    missionTemplateController.deleteTemplate
);


// ========================================
// Mission Template Route
// ========================================

// 建立 Template Route
router.post(
    "/:templateId/route",
    missionTemplateRouteController.createTemplateRoute
);


// 取得 Template Route
router.get(
    "/:templateId/route",
    missionTemplateRouteController.getTemplateRoute
);


// 更新 Template Route
router.patch(
    "/:templateId/route",
    missionTemplateRouteController.updateTemplateRoute
);


// ========================================
// 取得單一 Mission Template
// ========================================

router.get(
    "/:id",
    missionTemplateController.getTemplateById
);


module.exports = router;