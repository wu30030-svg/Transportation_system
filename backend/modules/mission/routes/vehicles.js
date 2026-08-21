const express = require("express");

const router = express.Router();

const vehicleController =
    require("../controllers/vehicleController");


// ========================================
// Vehicle
// ========================================

// POST /api/vehicles
router.post(
    "/",
    vehicleController.createVehicle
);


// GET /api/vehicles
router.get(
    "/",
    vehicleController.getAllVehicles
);


// GET /api/vehicles/:id
router.get(
    "/:id",
    vehicleController.getVehicleById
);


// PATCH /api/vehicles/:id
router.patch(
    "/:id",
    vehicleController.updateVehicle
);


// DELETE /api/vehicles/:id
router.delete(
    "/:id",
    vehicleController.deleteVehicle
);


module.exports = router;