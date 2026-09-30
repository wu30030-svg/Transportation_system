require("dotenv").config({
    path: require("path").join(
        __dirname,
        "../.env"
    )
});
const AZURE_MAPS_KEY =
    process.env.AZURE_MAPS_KEY;


async function calculateRoute({
    start,
    end,
    waypoints = []
}) {

    if (!AZURE_MAPS_KEY) {

        throw new Error(
            "AZURE_MAPS_KEY 未設定"
        );

    }

    if (!start || !end) {

        throw new Error(
            "Route 起點與終點不可為空"
        );

    }

    const locations = [
        {
            ...start,
            pointType: "waypoint"
        },
        ...waypoints.map(point => ({
            ...point,
            pointType: "viaWaypoint"
        })),
        {
            ...end,
            pointType: "waypoint"
        }
    ];

    const features =
        locations.map(
            (point, index) => ({
                type: "Feature",

                geometry: {
                    type: "Point",
                    coordinates: [
                        point.longitude,
                        point.latitude
                    ]
                },

                properties: {
                    pointIndex: index,
                    pointType: point.pointType
                }
            })
        );

    const requestBody = {

        type: "FeatureCollection",

        features,

        travelMode: "driving",

        routeOutputOptions: [
            "routePath"
        ]

    };

    const url =
        new URL(
            "https://atlas.microsoft.com/route/directions"
        );

    url.searchParams.set(
        "api-version",
        "2025-01-01"
    );

    url.searchParams.set(
        "subscription-key",
        AZURE_MAPS_KEY
    );

    const response =
        await fetch(
            url.toString(),
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/geo+json"
                },

                body:
                    JSON.stringify(
                        requestBody
                    )
            }
        );

    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `Azure Maps Route API HTTP ${response.status}: ${errorText}`
        );

    }

    const data =
        await response.json();

    if (
        !data.features ||
        !data.features.length
    ) {

        throw new Error(
            "Azure Maps 沒有回傳路線"
        );

    }

    return data;
}

module.exports = {
    calculateRoute
};