const {
    getRouteCameras,
    calculateTruckRoute,
    recalculateEditedTruckRoute
} = require("../services/routeService");


// ========================================
// Route → CCTV
// ========================================

async function routeController(req, res) {

    try {

        const { decodedPath } = req.body;

        if (!Array.isArray(decodedPath) || decodedPath.length === 0) {

            return res.status(400).json({
                success: false,
                message: "decodedPath is required"
            });

        }

        const result = await getRouteCameras(decodedPath);

        console.log("========== Route API ==========");
        console.log(`Route points: ${decodedPath.length}`);
        console.log("Start:", decodedPath[0]);
        console.log("End:", decodedPath[decodedPath.length - 1]);
        console.log("===============================");

        res.json({

            success: true,
            points: decodedPath.length,
            bbox: result.bbox,
            cameras: result.cameras

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

}


// ========================================
// Azure Maps → Truck Route
// ========================================

async function truckRouteController(req, res) {

    try {

        const {
            origin,
            destination,
            height,
            width,
            weightKg,
            loadType
        } = req.body;


        if (!origin || !destination) {

            return res.status(400).json({
                success: false,
                message: "origin and destination are required"
            });

        }


        const route = await calculateTruckRoute({

            origin,
            destination,
            height: Number(height) || 4.0,
            width: Number(width) || 2.5,
            weightKg: Number(weightKg) || 20000,
            loadType: loadType || ""

        });


        if (!route) {

            return res.status(404).json({
                success: false,
                message: "No truck route found"
            });

        }


        console.log("========== Truck Route API ==========");
        console.log("Origin:", origin);
        console.log("Destination:", destination);
        console.log(`Points: ${route.length}`);
        console.log("=====================================");


        res.json({

            success: true,
            points: route.length,
            path: route

        });

    }

    catch (err) {

        console.error("[Truck Route Error]", err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

}

// ========================================
// Azure Maps → 編輯後 Truck Route
// ========================================

async function editTruckRouteController(req, res) {

    try {

        const {
            controlPoints,
            previousPath,
            editedIndex,
            height,
            width,
            weightKg,
            loadType
        } = req.body;


        // ========================================
        // Validation
        // ========================================

        if (
            !Array.isArray(controlPoints) ||
            controlPoints.length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "controlPoints must contain at least 2 points"

            });

        }


        // ========================================
        // 驗證控制點
        // ========================================

        for (const point of controlPoints) {

            if (
                typeof point.lat !== "number" ||
                typeof point.lng !== "number"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Each control point must contain numeric lat/lng"

                });

            }

        }

        if (!Array.isArray(previousPath) || previousPath.length < 2) {

            return res.status(400).json({

                success: false,

                message: "previousPath must contain at least 2 points"

            });

        }

        if (!Number.isInteger(editedIndex)) {

            return res.status(400).json({

                success: false,

                message: "editedIndex must be an integer"

            });

        }

        if (
            editedIndex <= 0 ||
            editedIndex >= controlPoints.length - 1
        ) {

            return res.status(400).json({

                success: false,

                message: "editedIndex must reference an intermediate control point"

            });

        }

        // ========================================
        // Azure Maps 重新計算
        // ========================================

        const route =
            await recalculateEditedTruckRoute({

                controlPoints,

                previousPath,

                editedIndex,

                height: Number(height) || 4.0,

                width: Number(width) || 2.5,

                weightKg:
                    Number(weightKg) || 20000,

                loadType:
                    loadType || ""

            });


        if (
            !route ||
            route.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "No edited truck route found"

            });

        }


        console.log(
            "========== Edited Truck Route API =========="
        );

        console.log(
            `Control points: ${controlPoints.length}`
        );

        console.log(
            `Route points: ${route.length}`
        );

        console.log(
            "============================================"
        );


        res.json({

            success: true,

            points: route.length,

            path: route

        });

    }

    catch (err) {

        console.error(
            "[Edited Truck Route Error]",
            err
        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

}

module.exports = {
    getRouteCameras: routeController,
    truckRouteController,
    editTruckRouteController
};