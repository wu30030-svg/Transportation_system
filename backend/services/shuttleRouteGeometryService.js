const azureMapsService =
    require("./azureMapsService");

const shuttleRouteStops =
    require("../data/shuttle-route-stops");

const shuttleRouteGeometry =
    require("../data/shuttle-route-geometry-final");


const MAX_VIA_WAYPOINTS = 10;


/**
 * 將完整路線控制點切成 Azure Maps 可接受的區段。
 *
 * Azure Maps：
 * 1 start
 * + 最多 10 viaWaypoints
 * + 1 end
 *
 * 因此每個 Segment 最多可以包含 12 個點。
 */
function splitRoutePoints(
    points,
    segmentSize = MAX_VIA_WAYPOINTS + 2
) {

    if (!Array.isArray(points)) {
        throw new Error(
            "路線控制點必須是陣列"
        );
    }

    if (points.length < 2) {
        throw new Error(
            "路線至少需要兩個控制點"
        );
    }

    if (
        !Number.isInteger(segmentSize) ||
        segmentSize < 2
    ) {
        throw new Error(
            "segmentSize 必須是大於等於 2 的整數"
        );
    }

    const segments = [];

    let startIndex = 0;

    while (
        startIndex <
        points.length - 1
    ) {

        const endIndex =
            Math.min(
                startIndex +
                segmentSize -
                1,
                points.length - 1
            );

        const segmentPoints =
            points.slice(
                startIndex,
                endIndex + 1
            );

        segments.push({

            startIndex,

            endIndex,

            points:
                segmentPoints

        });

        if (
            endIndex >=
            points.length - 1
        ) {
            break;
        }

        startIndex =
            endIndex;

    }

    return segments;
}

/**
 * 將兩個座標陣列合併。
 *
 * 如果下一段第一個座標就是上一段最後一個座標，
 * 移除重複端點。
 */
function mergeRouteCoordinates(
    existingCoordinates,
    nextCoordinates
) {

    if (!Array.isArray(nextCoordinates)) {
        return existingCoordinates;
    }

    if (
        !Array.isArray(existingCoordinates) ||
        existingCoordinates.length === 0
    ) {
        return [
            ...nextCoordinates
        ];
    }

    const merged =
        [
            ...existingCoordinates
        ];

    const lastExisting =
        merged[
        merged.length - 1
        ];

    const firstNext =
        nextCoordinates[0];

    const isSamePoint =
        Array.isArray(lastExisting) &&
        Array.isArray(firstNext) &&
        lastExisting[0] === firstNext[0] &&
        lastExisting[1] === firstNext[1];

    if (isSamePoint) {

        merged.push(
            ...nextCoordinates.slice(1)
        );

    } else {

        merged.push(
            ...nextCoordinates
        );

    }

    return merged;
}


/**
 * 將 Azure Maps 回傳的 RoutePath
 * MultiLineString 合併成一個完整 MultiLineString。
 */
function mergeRouteGeometries(
    geometries
) {

    const mergedCoordinates = [];

    for (
        const geometry
        of geometries
    ) {

        if (!geometry) {
            continue;
        }

        if (
            geometry.type ===
            "MultiLineString"
        ) {

            for (
                const line
                of geometry.coordinates
            ) {

                if (
                    !Array.isArray(line) ||
                    line.length === 0
                ) {
                    continue;
                }

                const previousLine =
                    mergedCoordinates[
                    mergedCoordinates.length - 1
                    ];

                if (
                    Array.isArray(previousLine)
                ) {

                    mergedCoordinates[
                        mergedCoordinates.length - 1
                    ] =
                        mergeRouteCoordinates(
                            previousLine,
                            line
                        );

                } else {

                    mergedCoordinates.push(
                        [
                            ...line
                        ]
                    );

                }

            }

        } else if (
            geometry.type ===
            "LineString"
        ) {

            const previousLine =
                mergedCoordinates[
                mergedCoordinates.length - 1
                ];

            if (
                Array.isArray(previousLine)
            ) {

                mergedCoordinates[
                    mergedCoordinates.length - 1
                ] =
                    mergeRouteCoordinates(
                        previousLine,
                        geometry.coordinates
                    );

            } else {

                mergedCoordinates.push(
                    [
                        ...geometry.coordinates
                    ]
                );

            }

        }

    }

    if (
        mergedCoordinates.length === 0
    ) {

        throw new Error(
            "Azure Maps Geometry 合併後沒有有效座標"
        );

    }

    return {
        type: "MultiLineString",
        coordinates:
            mergedCoordinates
    };
}

/**
 * 取得已固定保存的接駁路線 Geometry。
 *
 * 正式監控流程使用這個函式，
 * 不再重新呼叫 Azure Maps。
 */
function getStoredRouteGeometry({
    routeCode,
    direction
}) {

    const route =
        shuttleRouteGeometry[routeCode];

    if (!route) {

        throw new Error(
            `找不到固定 Geometry 路線: ${routeCode}`
        );

    }

    const geometry =
        route[direction];

    if (
        !geometry ||
        !Array.isArray(geometry.coordinates)
    ) {

        throw new Error(
            `找不到固定 Geometry: ${routeCode} / ${direction}`
        );

    }

    return geometry;
}

/**
 * 建立接駁路線完整 Geometry。
 *
 * 新設計：
 *
 * STOP / JUNCTION / STOP / JUNCTION ...
 *
 * 第一個點：
 *   Azure start
 *
 * 中間所有點：
 *   Azure viaWaypoints
 *
 * 最後一個點：
 *   Azure end
 *
 * 若控制點超過 Azure 單次 10 個 viaWaypoints
 * 的限制，會自動切成多個 Segment。
 */
async function buildStopToStopGeometry({
    routeCode,
    direction
}) {

    const route =
        shuttleRouteStops[routeCode];

    if (!route) {

        throw new Error(
            `找不到接駁路線: ${routeCode}`
        );

    }

    const points =
        route[direction];

    if (!Array.isArray(points)) {

        throw new Error(
            `找不到路線方向: ${routeCode} / ${direction}`
        );

    }

    const validPoints =
        points.filter(
            point =>
                point &&
                point.location &&
                typeof point.location.latitude ===
                "number" &&
                typeof point.location.longitude ===
                "number"
        );

    if (validPoints.length < 2) {

        throw new Error(
            `路線至少需要兩個有座標的點: ${routeCode} / ${direction}`
        );

    }

    const segmentSize =
        routeCode === "SHUINAN" &&
            direction === "inbound"
            ? 7
            : MAX_VIA_WAYPOINTS + 2;

    const routeSegments =
        splitRoutePoints(
            validPoints,
            segmentSize
        );

    console.log(
        "[Shuttle Route Geometry] 路線控制點:",
        {
            routeCode,
            direction,
            pointCount:
                validPoints.length,
            segmentCount:
                routeSegments.length
        }
    );

    const geometries = [];

    for (
        let index = 0;
        index < routeSegments.length;
        index++
    ) {

        const segment =
            routeSegments[index];

        const segmentPoints =
            segment.points;

        const start =
            segmentPoints[0].location;

        const end =
            segmentPoints[
                segmentPoints.length - 1
            ].location;

        const waypoints =
            segmentPoints
                .slice(1, -1)
                .map(
                    point =>
                        point.location
                );

        console.log(
            "[Shuttle Route Geometry] Azure Maps Segment:",
            {
                segment:
                    index + 1,
                totalSegments:
                    routeSegments.length,
                startIndex:
                    segment.startIndex,
                endIndex:
                    segment.endIndex,
                pointCount:
                    segmentPoints.length,
                waypointCount:
                    waypoints.length,
                start:
                    segmentPoints[0].name,
                end:
                    segmentPoints[
                        segmentPoints.length - 1
                    ].name
            }
        );

        const data =
            await azureMapsService.calculateRoute({
                start,
                end,
                waypoints
            });

        const routePath =
            data.features?.find(
                feature =>
                    feature.properties?.type ===
                    "RoutePath"
            );

        if (!routePath) {

            throw new Error(
                `Azure Maps 沒有回傳 RoutePath: ${routeCode} / ${direction} / Segment ${index + 1}`
            );

        }

        geometries.push(
            routePath.geometry
        );

    }

    const geometry =
        mergeRouteGeometries(
            geometries
        );

    return {

        routeCode,

        direction,

        startStop:
            validPoints[0].name,

        endStop:
            validPoints[
                validPoints.length - 1
            ].name,

        points:
            validPoints.map(
                (point, index) => ({
                    index,
                    type:
                        point.type,
                    name:
                        point.name,
                    roads:
                        point.roads || [],
                    location:
                        point.location
                })
            ),

        segmentCount:
            routeSegments.length,

        geometry

    };

}


module.exports = {
    buildStopToStopGeometry,
    getStoredRouteGeometry,
    splitRoutePoints,
    mergeRouteGeometries
};