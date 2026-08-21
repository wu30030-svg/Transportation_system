const pool = require("../config/db");
const {
    loadCameraData
} = require("../services/cameraService");

// 原本 API
async function getAllCameras(req, res) {

    try {

        const cameras = await loadCameraData();

        res.json(cameras);

    } catch (err) {

        console.error("[CameraController]", err);

        res.status(500).json({
            success: false,
            message: "讀取監視器失敗"
        });

    }

}

// 新的 Viewport API
async function getViewportCameras(req, res) {

    try {

        const {
            minLat,
            maxLat,
            minLon,
            maxLon
        } = req.query;

        if (!minLat || !maxLat || !minLon || !maxLon) {
            return res.status(400).json({
                error: "缺少 Bounding Box 參數"
            });
        }

        const result = await pool.query(
            `
            SELECT *
            FROM cameras
            WHERE latitude BETWEEN $1 AND $2
              AND longitude BETWEEN $3 AND $4
            ORDER BY camera_id
            `,
            [
                Number(minLat),
                Number(maxLat),
                Number(minLon),
                Number(maxLon)
            ]
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

}

module.exports = {
    getAllCameras,
    getViewportCameras
};