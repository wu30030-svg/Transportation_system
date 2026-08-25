const express = require("express");
const router = express.Router();

const {
    getRouteCameras,
    truckRouteController
} = require("../controllers/routesController");


// ========================================
// Route → CCTV
// ========================================

router.post("/cameras", getRouteCameras);


// ========================================
// Azure Maps → Truck Route
// ========================================

router.post("/truck", truckRouteController);


module.exports = router;