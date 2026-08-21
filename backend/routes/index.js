const express = require("express");

const router = express.Router();


// ========================================
// Camera
// ========================================

router.use("/cameras", require("./cameras"));


// ========================================
// Legacy Route API
// ========================================

router.use("/routes", require("./routes"));

// ========================================
// Auth Module
// ========================================

router.use(
    "/auth",
    require("../modules/auth/routes/auth")
);

// ========================================
// Mission Module
// ========================================

router.use(
    "/missions",
    require("../modules/mission/routes/missions")
);


// ========================================
// Mission Template Module
// ========================================

router.use(
    "/mission-templates",
    require("../modules/mission/routes/missionTemplates")
);

// ========================================
// Vehicle
// ========================================

router.use(
    "/vehicles",
    require("../modules/mission/routes/vehicles")
);

// ========================================
// Personnel
// ========================================

router.use(
    "/personnel",
    require("../modules/mission/routes/personnel")
);

// ========================================
// Mission Vehicle Assignment
// ========================================

router.use(
    "/mission-vehicle-assignments",
    require("../modules/mission/routes/missionVehicleAssignments")
);

module.exports = router;