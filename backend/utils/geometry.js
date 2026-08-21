function getDistanceSquared(p1, p2) {

    const dx = p1.lng - p2.lng;
    const dy = p1.lat - p2.lat;

    return dx * dx + dy * dy;

}
function calculateBoundingBox(path) {

    let minLat = Infinity;
    let maxLat = -Infinity;

    let minLng = Infinity;
    let maxLng = -Infinity;

    path.forEach(point => {

        const lat = Number(point.lat);
        const lng = Number(point.lng);

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;

        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;

    });

    return {
        minLat,
        maxLat,
        minLng,
        maxLng
    };

}

function distancePointToSegment(point, start, end) {

    const l2 = getDistanceSquared(start, end);

    if (l2 === 0) {
        return Math.sqrt(getDistanceSquared(point, start));
    }

    let t =
        (
            (point.lng - start.lng) * (end.lng - start.lng) +
            (point.lat - start.lat) * (end.lat - start.lat)
        ) / l2;

    t = Math.max(0, Math.min(1, t));

    const projection = {

        lng: start.lng + t * (end.lng - start.lng),
        lat: start.lat + t * (end.lat - start.lat)

    };

    return Math.sqrt(getDistanceSquared(point, projection));

}

function isCameraNearRoute(camera, route, tolerance) {

    for (let i = 0; i < route.length - 1; i++) {

        const distance = distancePointToSegment(

            camera,

            route[i],

            route[i + 1]

        );

        if (distance < tolerance) {
            return true;
        }

    }

    return false;

}

module.exports = {

    calculateBoundingBox,

    isCameraNearRoute

};