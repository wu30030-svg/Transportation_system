const express = require("express");
const router = express.Router();

const {
    getRouteCameras,
    truckRouteController,
    editTruckRouteController
} = require("../controllers/routesController");


// ========================================
// Route → CCTV
// ========================================

router.post(
    "/cameras",
    getRouteCameras
);


// ========================================
// Azure Maps → Truck Route
// ========================================

router.post(
    "/truck",
    truckRouteController
);


// ========================================
// Azure Maps → Edited Truck Route
// ========================================

router.post(
    "/truck/edit",
    editTruckRouteController
);


module.exports = router;