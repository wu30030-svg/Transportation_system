const express = require("express");

const router = express.Router();

const controller =
    require("../controllers/missionVehicleAssignmentController");


// ========================================
// Mission Vehicle Assignments
// ========================================

// 建立 Mission Vehicle Assignment
router.post(
    "/",
    controller.createAssignment
);


// ========================================
// 取得 Mission 的所有 Vehicle Assignments
// ========================================

router.get(
    "/mission/:missionId",
    controller.getAssignmentsByMissionId
);


// ========================================
// 取得單一 Assignment
// ========================================

router.get(
    "/:id",
    controller.getAssignmentById
);


// ========================================
// 更新 Assignment
// ========================================

router.patch(
    "/:id",
    controller.updateAssignment
);


// ========================================
// 刪除 Assignment
// ========================================

router.delete(
    "/:id",
    controller.deleteAssignment
);


module.exports = router;