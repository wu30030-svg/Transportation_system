const missionRunService = require(
    "../services/missionRunService"
);


// ========================================
// Start Mission Run
// ========================================

async function startMissionRun(req, res) {

    try {

        const { missionId } = req.params;


        const result =
            await missionRunService.startMissionRun(
                missionId
            );


        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "startMissionRun error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            error: {
                message: error.message
            }
        });
    }
}

// ========================================
// Get Mission Runs
// GET /api/missions/:missionId/runs
// ========================================

async function getMissionRunsByMissionId(req, res) {

    try {

        const { missionId } = req.params;

        const missionRuns =
            await missionRunService.getMissionRunsByMissionId(
                missionId
            );

        return res.status(200).json({
            success: true,
            data: missionRuns
        });

    } catch (error) {

        console.error(
            "getMissionRunsByMissionId error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            error: {
                message: error.message
            }
        });
    }
}

// ========================================
// Complete Mission Run
// POST /api/missions/:missionId/runs/:missionRunId/complete
// ========================================

async function completeMissionRun(req, res) {

    try {

        const { missionRunId } = req.params;

        const result =
            await missionRunService.completeMissionRun(
                missionRunId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "completeMissionRun error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            error: {
                message: error.message
            }
        });
    }
}

// ========================================
// Abort Mission Run
// POST /api/missions/:missionId/runs/:missionRunId/abort
// ========================================

async function abortMissionRun(req, res) {

    try {

        const { missionRunId } = req.params;

        const result =
            await missionRunService.abortMissionRun(
                missionRunId
            );

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(
            "abortMissionRun error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            error: {
                message: error.message
            }
        });
    }
}

module.exports = {
    startMissionRun,
    getMissionRunsByMissionId,
    completeMissionRun,
    abortMissionRun
};
