const express = require("express");

const {
    authenticateToken
} = require("../../../middleware/authMiddleware");

const trackingController =
    require("../controllers/trackingController");


const router = express.Router();


// ========================================
// Tracking
// ========================================

router.use(authenticateToken);


// ========================================
// Record Personnel GPS
// POST /api/tracking/locations
// ========================================

router.post(
    "/locations",
    trackingController.recordLocation
);


// ========================================
// Mission Run Tracking History
// GET /api/tracking/runs/:missionRunId
// ========================================

router.get(
    "/runs/:missionRunId",
    trackingController.getMissionRunTracking
);


// ========================================
// Current Mission Vehicle Locations
// GET /api/tracking/missions/:missionId/current
// ========================================

router.get(
    "/missions/:missionId/current",
    trackingController.getCurrentMissionLocations
);


module.exports = router;