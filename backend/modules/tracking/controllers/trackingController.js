const trackingService =
    require("../services/trackingService");


// ========================================
// Record Location
// POST /api/tracking/locations
// ========================================

async function recordLocation(req, res) {

    try {

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        const personnelId =
            req.user.personnel_id;


        if (!personnelId) {

            return res.status(403).json({
                success: false,
                message:
                    "Authenticated account is not linked to personnel"
            });
        }


        const {
            missionRunId,
            latitude,
            longitude,
            accuracy,
            recordedAt
        } = req.body;


        const result =
            await trackingService.recordLocation({
                missionRunId,
                personnelId,
                latitude,
                longitude,
                accuracy,
                recordedAt
            });


        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "[Tracking] Record location error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Failed to record tracking location"
        });
    }
}


// ========================================
// Get Mission Run Tracking
// GET /api/tracking/runs/:missionRunId
// ========================================

async function getMissionRunTracking(
    req,
    res
) {

    try {

        const {
            missionRunId
        } = req.params;


        const locations =
            await trackingService
                .getMissionRunTracking(
                    missionRunId
                );


        return res.status(200).json({
            success: true,
            data: locations
        });

    } catch (error) {

        console.error(
            "[Tracking] Get run tracking error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Failed to get tracking data"
        });
    }
}


// ========================================
// Get Current Mission Locations
// GET /api/tracking/missions/:missionId/current
// ========================================

async function getCurrentMissionLocations(
    req,
    res
) {

    try {

        const {
            missionId
        } = req.params;


        const locations =
            await trackingService
                .getCurrentMissionLocations(
                    missionId
                );


        return res.status(200).json({
            success: true,
            data: locations
        });

    } catch (error) {

        console.error(
            "[Tracking] Get current locations error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Failed to get current mission locations"
        });
    }
}

async function recordShuttleLocation(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const personnelId = req.user.personnel_id;

        if (!personnelId) {
            return res.status(403).json({
                success: false,
                message:
                    "Authenticated account is not linked to personnel"
            });
        }

        const {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            recordedAt
        } = req.body;

        const result =
            await trackingService.recordShuttleLocation({
                personnelId,
                latitude,
                longitude,
                accuracy,
                speed,
                heading,
                recordedAt
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(
            "[Shuttle Tracking] Record location error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to record shuttle location"
        });
    }
}


async function getCurrentShuttleLocations(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const locations =
            await trackingService.getCurrentShuttleLocations();

        return res.status(200).json({
            success: true,
            data: locations
        });

    } catch (error) {
        console.error(
            "[Shuttle Tracking] Get current locations error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to get current shuttle locations"
        });
    }
}

module.exports = {
    recordLocation,
    getMissionRunTracking,
    getCurrentMissionLocations,
    recordShuttleLocation,
    getCurrentShuttleLocations
};