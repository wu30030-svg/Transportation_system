const shuttleRouteStops =
    require("../data/shuttle-route-stops");


function buildRouteSegments(routeCode, direction) {

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

    return segments.map(
        (segment, index) => ({
            index,
            type: segment.type,
            name: segment.name,
            location:
                segment.location || null
        })
    );

}


function buildShuttleRouteGeometryInput(
    routeCode
) {

    return {

        routeCode,

        outbound:
            buildRouteSegments(
                routeCode,
                "outbound"
            ),

        inbound:
            buildRouteSegments(
                routeCode,
                "inbound"
            )

    };

}


module.exports = {
    buildRouteSegments,
    buildShuttleRouteGeometryInput
};