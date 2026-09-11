const {
    getCctvSource,
    getCctvSnapshot,
    relayCctvStream
} = require("../services/cctvStreamService");


// ========================================
// Get CCTV Source
// ========================================

async function getCctvSourceController(req, res) {

    try {

        const { cameraId } =
            req.params;

        const camera =
            await getCctvSource(cameraId);

        res.json({
            success: true,
            data: camera
        });

    } catch (error) {

        console.error(
            "[CCTV Controller] Get source failed:",
            error
        );

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });
    }
}


// ========================================
// Stream CCTV
// ========================================

async function streamCctvController(req, res) {

    try {

        const { cameraId } =
            req.params;

        await relayCctvStream(
            cameraId,
            res
        );

    } catch (error) {

        console.error(
            "[CCTV Controller] Stream failed:",
            error
        );

        if (!res.headersSent) {

            res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });

        } else if (!res.destroyed) {

            res.end();
        }
    }
}


// ========================================
// Snapshot CCTV
// ========================================

async function snapshotCctvController(req, res) {

    try {

        const { cameraId } =
            req.params;


        const snapshot =
            await getCctvSnapshot(
                cameraId
            );


        res.status(200);


        res.setHeader(
            "Content-Type",
            snapshot.contentType
        );


        res.setHeader(
            "Content-Length",
            snapshot.buffer.length
        );


        res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
        );


        res.setHeader(
            "Pragma",
            "no-cache"
        );


        res.setHeader(
            "Expires",
            "0"
        );


        res.end(
            snapshot.buffer
        );


    } catch (error) {

        console.error(
            "[CCTV Controller] Snapshot failed:",
            error
        );


        if (!res.headersSent) {

            res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });

        } else if (!res.destroyed) {

            res.end();
        }
    }
}


module.exports = {
    getCctvSourceController,
    streamCctvController,
    snapshotCctvController
};