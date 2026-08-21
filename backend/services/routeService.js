const pool = require("../config/db");

const {
    calculateBoundingBox,
    isCameraNearRoute
} = require("../utils/geometry");

async function getRouteCameras(decodedPath) {

    const bbox = calculateBoundingBox(decodedPath);

    const result = await pool.query(

        `
        SELECT *
        FROM cameras
        WHERE latitude BETWEEN $1 AND $2
          AND longitude BETWEEN $3 AND $4
        ORDER BY camera_id
        `,

        [
            bbox.minLat,
            bbox.maxLat,
            bbox.minLng,
            bbox.maxLng
        ]

    );

    const tolerance = 0.003;

    const routeCameras = result.rows.filter(camera =>

        isCameraNearRoute(

            {
                lat: Number(camera.latitude),
                lng: Number(camera.longitude)
            },

            decodedPath,

            tolerance

        )

    );

    console.log("Bounding Box 內 CCTV：", result.rows.length);
    console.log(`Route Filter：${routeCameras.length} 支`);

    return {

        bbox,

        cameras: routeCameras

    };

}

module.exports = {

    getRouteCameras

};