const missionMonitoringService =
    require("../services/missionMonitoringService");


// ========================================
// Create Mission Monitoring
// ========================================

async function createMonitoring(req, res) {

    try {

        const {
            cameraId
        } = req.body;

        const {
            missionId
        } = req.params;


        const result =
            await missionMonitoringService.createMonitoring({
                missionId,
                cameraId
            });


        return res.status(201).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Create Mission Monitoring Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}

// ========================================
// Delete Mission Monitoring
// ========================================

async function deleteMonitoring(req, res) {

    try {

        const {
            missionId,
            monitoringId
        } = req.params;


        const result =
            await missionMonitoringService.deleteMonitoring({
                missionId,
                monitoringId
            });


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Delete Mission Monitoring Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}

// ========================================
// Pin Mission Monitoring
// ========================================

async function pinMonitoring(req, res) {

    try {

        const {
            missionId,
            monitoringId
        } = req.params;


        const result =
            await missionMonitoringService.pinMonitoring({
                missionId,
                monitoringId
            });


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Pin Mission Monitoring Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}

// ========================================
// Unpin Mission Monitoring
// ========================================

async function unpinMonitoring(req, res) {

    try {

        const {
            missionId,
            monitoringId
        } = req.params;


        const result =
            await missionMonitoringService.unpinMonitoring({
                missionId,
                monitoringId
            });


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Unpin Mission Monitoring Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}

// ========================================
// Swap Mission Monitoring Order
// ========================================

async function swapMonitoring(req, res) {

    try {

        const {
            missionId
        } = req.params;

        const {
            monitoringIdA,
            monitoringIdB
        } = req.body;


        const result =
            await missionMonitoringService.swapMonitoring({
                missionId,
                monitoringIdA,
                monitoringIdB
            });


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Swap Mission Monitoring Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}

// ========================================
// Get Mission Monitorings
// ========================================

async function getMonitoringsByMissionId(req, res) {

    try {

        const {
            missionId
        } = req.params;


        const result =
            await missionMonitoringService
                .getMonitoringsByMissionId(missionId);


        return res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(
            "Get Mission Monitorings Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    createMonitoring,
    deleteMonitoring,
    pinMonitoring,
    unpinMonitoring,
    swapMonitoring,
    getMonitoringsByMissionId
};