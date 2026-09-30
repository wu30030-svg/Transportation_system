function extractRoadSegments(segments) {

    if (!Array.isArray(segments)) {
        return [];
    }

    return segments
        .filter(segment => segment.type === "ROAD")
        .map(segment => ({
            name: segment.name
        }));

}


function extractStops(segments) {

    if (!Array.isArray(segments)) {
        return [];
    }

    return segments
        .filter(segment => segment.type === "STOP")
        .map(segment => ({
            name: segment.name,
            location: segment.location || null
        }));

}


function resolveRouteStructure(segments) {

    if (!Array.isArray(segments)) {
        throw new Error(
            "路線 segments 必須是陣列"
        );
    }

    return {

        stops:
            extractStops(segments),

        roads:
            extractRoadSegments(segments)

    };

}


module.exports = {
    extractRoadSegments,
    extractStops,
    resolveRouteStructure
};