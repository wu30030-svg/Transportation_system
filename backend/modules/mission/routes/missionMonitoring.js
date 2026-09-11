const express = require("express");

const router = express.Router();

const {
    createMonitoring,
    deleteMonitoring,
    pinMonitoring,
    unpinMonitoring,
    swapMonitoring,
    getMonitoringsByMissionId
} = require("../controllers/missionMonitoringController");


// ========================================
// Mission Monitoring
// ========================================

// Create Mission Monitoring
router.post(
    "/:missionId/monitoring",
    createMonitoring
);

// Delete Mission Monitoring

router.delete(
    "/:missionId/monitoring/:monitoringId",
    deleteMonitoring
);

// Pin Mission Monitoring

router.patch(
    "/:missionId/monitoring/:monitoringId/pin",
    pinMonitoring
);

// Unpin Mission Monitoring
router.patch(
    "/:missionId/monitoring/:monitoringId/unpin",
    unpinMonitoring
);

// Swap Mission Monitoring Order
router.patch(
    "/:missionId/monitoring/reorder",
    swapMonitoring
);

// Get Mission Monitorings

router.get(
    "/:missionId/monitoring",
    getMonitoringsByMissionId
);


module.exports = router;