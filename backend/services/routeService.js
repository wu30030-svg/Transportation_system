const pool = require("../config/db");

const { calculateBoundingBox, isCameraNearRoute } = require("../utils/geometry");

// Route → CCTV

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
        [bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng]
    );

    const tolerance = 0.003;

    const routeCameras = result.rows.filter(camera => isCameraNearRoute(
        {
            lat: Number(camera.latitude), lng: Number(camera.longitude)
        },
        decodedPath, tolerance
    )
    );

    console.log("Bounding Box CCTV:", result.rows.length);
    console.log(`Route Filter: ${routeCameras.length}`);

    return { bbox, cameras: routeCameras };
}

// Azure Maps → Truck Route

async function calculateTruckRoute({ origin, destination, height, width, weightKg, loadType }) {

    const azureKey = process.env.AZURE_MAPS_KEY;

    if (!azureKey) { throw new Error("AZURE_MAPS_KEY is not configured"); }

    let url =
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
    console.log("Origin:", origin);
    console.log("Destination:", destination);

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {

        console.error("[Azure Maps] API Error:", data);

        throw new Error(data?.error?.description || `Azure Maps API returned ${response.status}`);
    }

    if (!data.routes || data.routes.length === 0) {
        return null;
    }

    const points = data.routes[0].legs.flatMap(leg => leg.points);

    return points.map(point => ({ lat: point.latitude, lng: point.longitude }));
}

// Route Editor：路線幾何工具

// 計算兩個座標之間的距離（公尺）
function calculateDistanceMeters(pointA, pointB) {

    const R = 6371000;

    const lat1 = pointA.lat * Math.PI / 180;
    const lat2 = pointB.lat * Math.PI / 180;

    const deltaLat = (pointB.lat - pointA.lat) * Math.PI / 180;

    const deltaLng = (pointB.lng - pointA.lng) * Math.PI / 180;

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) ** 2;

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// 計算完整路線長度

function calculateRouteLength(path) {

    if (!Array.isArray(path) || path.length < 2) {
        return 0;
    }

    let totalDistance = 0;

    for (let i = 1; i < path.length; i++) {

        totalDistance += calculateDistanceMeters(path[i - 1], path[i]);

    }

    return totalDistance;
}

// Azure Maps → 編輯後重新貼道路
// controlPoints:
// [ { lat, lng }, { lat, lng }, { lat, lng } ]
// 每兩個控制點之間重新呼叫 Azure Maps
// 最後把所有道路段串成一條完整路線。

async function recalculateEditedTruckRoute({
    controlPoints,
    previousPath,
    editedIndex,
    height,
    width,
    weightKg,
    loadType
}) {

    if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
        throw new Error("At least 2 control points are required");
    }

    if (!Array.isArray(previousPath) || previousPath.length < 2) {
        throw new Error("previousPath must contain at least 2 points");
    }

    if (!Number.isInteger(editedIndex)) {
        throw new Error("editedIndex must be an integer");
    }

    if (
        editedIndex <= 0 ||
        editedIndex >= controlPoints.length - 1
    ) {
        throw new Error(
            "editedIndex must reference an intermediate control point"
        );
    }

    console.log("========== Edited Truck Route ==========");
    console.log(`Control points: ${controlPoints.length}`);
    console.log(`Edited index: ${editedIndex}`);

    // =====================================================
    // 1. 找出被修改控制點前後的兩個控制點
    // =====================================================

    const previousControlPoint =
        controlPoints[editedIndex - 1];

    const editedControlPoint =
        controlPoints[editedIndex];

    const nextControlPoint =
        controlPoints[editedIndex + 1];

    console.log(
        "[Local Edit]",
        "Previous:",
        previousControlPoint
    );

    console.log(
        "[Local Edit]",
        "Edited:",
        editedControlPoint
    );

    console.log(
        "[Local Edit]",
        "Next:",
        nextControlPoint
    );


    // =====================================================
    // 2. 找出 previousPath 中對應的控制點位置
    //
    // 這裡不重新計算整條道路。
    // 只找出原本道路上的三個控制點附近位置。
    // =====================================================

    function findNearestPathIndex(path, target) {

        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < path.length; i++) {

            const point = path[i];

            const distance =
                calculateDistanceMeters(point, target);

            if (distance < minDistance) {

                minDistance = distance;
                nearestIndex = i;

            }

        }

        return nearestIndex;
    }


    const previousIndex =
        findNearestPathIndex(
            previousPath,
            previousControlPoint
        );

    const nextIndex =
        findNearestPathIndex(
            previousPath,
            nextControlPoint
        );


    console.log(
        `[Local Edit] Previous path index: ${previousIndex}`
    );

    console.log(
        `[Local Edit] Next path index: ${nextIndex}`
    );


    // =====================================================
    // 3. 保護區
    //
    // 如果控制點順序異常，就拒絕這次編輯。
    // =====================================================

    if (previousIndex >= nextIndex) {

        throw new Error(
            "Invalid control point order"
        );

    }


    // =====================================================
    // 4. 只重新計算：
    //
    // Previous Control Point
    //          ↓
    //     Edited Point
    //          ↓
    // Next Control Point
    //
    // 也就是兩段 Azure Routing。
    // =====================================================

    console.log(
        "[Local Edit] Recalculating only edited section"
    );


    const firstSegment =
        await calculateTruckRoute({

            origin: previousControlPoint,

            destination: editedControlPoint,

            height,
            width,
            weightKg,
            loadType

        });


    if (!firstSegment || firstSegment.length === 0) {

        throw new Error(
            "Unable to calculate first edited segment"
        );

    }


    console.log(
        `[Local Edit] Segment A points: ${firstSegment.length}`
    );


    const secondSegment =
        await calculateTruckRoute({

            origin: editedControlPoint,

            destination: nextControlPoint,

            height,
            width,
            weightKg,
            loadType

        });


    if (!secondSegment || secondSegment.length === 0) {

        throw new Error(
            "Unable to calculate second edited segment"
        );

    }


    console.log(
        `[Local Edit] Segment B points: ${secondSegment.length}`
    );


    // =====================================================
    // 5. 建立新的局部道路
    // =====================================================

    const editedSegment = [
        ...firstSegment,
        ...secondSegment.slice(1)
    ];


    console.log(
        `[Local Edit] Edited section points: ${editedSegment.length}`
    );


    // =====================================================
    // 6. 保留原本道路前段
    // =====================================================

    const prefix =
        previousPath.slice(
            0,
            previousIndex + 1
        );


    // =====================================================
    // 7. 保留原本道路後段
    // =====================================================

    const suffix =
        previousPath.slice(
            nextIndex
        );


    // =====================================================
    // 8. 組合完整道路
    //
    // 舊前段
    // +
    // 新編輯段
    // +
    // 舊後段
    // =====================================================

    const finalPath = [
        ...prefix,
        ...editedSegment.slice(1),
        ...suffix.slice(1)
    ];


    // =====================================================
    // 9. 路線長度驗證
    // =====================================================

    const newRouteLength =
        calculateRouteLength(finalPath);

    const previousRouteLength =
        calculateRouteLength(previousPath);


    console.log(
        `[Route Validation] Previous: ${previousRouteLength.toFixed(0)} m`
    );

    console.log(
        `[Route Validation] New: ${newRouteLength.toFixed(0)} m`
    );


    if (previousRouteLength > 0) {

        const ratio =
            newRouteLength / previousRouteLength;


        console.log(
            `[Route Validation] Length ratio: ${ratio.toFixed(2)}`
        );


        if (ratio > 2.5) {

            const error =
                new Error(
                    "Edited route is excessively longer than the previous route"
                );

            error.code =
                "ROUTE_DETOUR_TOO_LARGE";

            error.previousLength =
                previousRouteLength;

            error.newLength =
                newRouteLength;

            error.ratio =
                ratio;

            throw error;

        }

    }


    console.log(
        "[Route Validation] Route accepted"
    );

    console.log(
        `Final edited route points: ${finalPath.length}`
    );

    console.log(
        "========================================"
    );


    return finalPath;
}


module.exports = {

    getRouteCameras,
    calculateTruckRoute,
    recalculateEditedTruckRoute

};