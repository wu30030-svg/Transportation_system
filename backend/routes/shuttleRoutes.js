const express = require("express");

const router = express.Router();

const shuttleRoutes =
    require("../data/shuttle-routes");

// ========================================
// GET /api/shuttle/routes
// ========================================

router.get(
    "/routes",
    (req, res) => {

        return res.json({
            success: true,
            data: shuttleRoutes
        });

    }
);

module.exports = router;