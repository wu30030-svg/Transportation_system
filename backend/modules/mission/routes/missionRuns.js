const express = require("express");

const missionRunController = require(
    "../controllers/missionRunController"
);

const router = express.Router();


// ========================================
// Start Mission Run
// POST /api/missions/:missionId/run
// ========================================

router.post(
    "/:missionId/run",
    missionRunController.startMissionRun
);

// ========================================
// Get Mission Runs
// GET /api/missions/:missionId/runs
// ========================================

router.get(
    "/:missionId/runs",
    missionRunController.getMissionRunsByMissionId
);

// ========================================
// Complete Mission Run
// POST /api/missions/:missionId/runs/:missionRunId/complete
// ========================================

router.post(
    "/:missionId/runs/:missionRunId/complete",
    missionRunController.completeMissionRun
);

// ========================================
// Abort Mission Run
// POST /api/missions/:missionId/runs/:missionRunId/abort
// ========================================

router.post(
    "/:missionId/runs/:missionRunId/abort",
    missionRunController.abortMissionRun
);

module.exports = router;
