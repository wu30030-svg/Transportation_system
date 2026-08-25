const pool = require("../config/db");

const {
    calculateBoundingBox,
    isCameraNearRoute
} = require("../utils/geometry");


// ========================================
// Route → CCTV
// ========================================

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

    console.log("Bounding Box CCTV:", result.rows.length);
    console.log(`Route Filter: ${routeCameras.length}`);

    return {
        bbox,
        cameras: routeCameras
    };
}


// ========================================
// Azure Maps → Truck Route
// ========================================

async function calculateTruckRoute({
    origin,
    destination,
    height,
    width,
    weightKg,
    loadType
}) {

    const azureKey = process.env.AZURE_MAPS_KEY;

    if (!azureKey) {
        throw new Error("AZURE_MAPS_KEY is not configured");
    }

    const url =
        "https://atlas.microsoft.com/route/directions/json" +
        "?api-version=1.0" +
        `&subscription-key=${encodeURIComponent(azureKey)}` +
        `&query=${origin.lat},${origin.lng}:${destination.lat},${destination.lng}` +
        "&travelMode=truck" +
        `&vehicleHeight=${encodeURIComponent(height)}` +
        `&vehicleWidth=${encodeURIComponent(width)}` +
        `&vehicleWeight=${encodeURIComponent(weightKg)}`;

    if (loadType) {
        url += `&vehicleLoadType=${encodeURIComponent(loadType)}`;
    }

    console.log("[Azure Maps] Truck Routing");

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        console.error("[Azure Maps] API Error:", data);

        throw new Error(
            data?.error?.description ||
            `Azure Maps API returned ${response.status}`
        );
    }

    if (!data.routes || data.routes.length === 0) {
        return null;
    }

    const points = data.routes[0].legs.flatMap(
        leg => leg.points
    );

    return points.map(point => ({
        lat: point.latitude,
        lng: point.longitude
    }));
}


module.exports = {

    getRouteCameras,
    calculateTruckRoute

};