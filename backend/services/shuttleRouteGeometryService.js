const azureMapsService =
    require("./azureMapsService");

const shuttleRouteStops =
    require("../data/shuttle-route-stops");


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

    const segments =
        route[direction];

    if (!Array.isArray(segments)) {

        throw new Error(
            `找不到路線方向: ${routeCode} / ${direction}`
        );

    }

    const stops =
        segments.filter(
            segment =>
                segment.type === "STOP" &&
                segment.location
        );

    if (stops.length < 2) {

        throw new Error(
            `路線至少需要兩個有座標的 STOP: ${routeCode} / ${direction}`
        );

    }

    const start =
        stops[0].location;

    const end =
        stops[stops.length - 1].location;

    const data =
        await azureMapsService.calculateRoute({
            start,
            end
        });

    const routePath =
        data.features?.find(
            feature =>
                feature.properties?.type ===
                "RoutePath"
        );

    if (!routePath) {

        throw new Error(
            `Azure Maps 沒有回傳 RoutePath: ${routeCode} / ${direction}`
        );

    }

    return {

        routeCode,

        direction,

        startStop:
            stops[0].name,

        endStop:
            stops[stops.length - 1].name,

        geometry:
            routePath.geometry

    };

}


module.exports = {
    buildStopToStopGeometry
};