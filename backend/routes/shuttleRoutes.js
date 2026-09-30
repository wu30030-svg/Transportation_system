const express = require("express");

const router = express.Router();

const shuttleRoutes =
    require("../data/shuttle-routes");

const shuttleRouteStops =
    require("../data/shuttle-route-stops");

const shuttleRouteGeometryService =
    require("../services/shuttleRouteGeometryService");

router.get(
    "/routes",
    (req, res) => {

        const data =
            shuttleRoutes.map(route => {

                const routeStops =
                    shuttleRouteStops[
                    route.routeCode
                    ];

                if (!routeStops) {
                    return {
                        ...route
                    };
                }

                return {
                    ...route,

                    outbound:
                        routeStops.outbound,

                    inbound:
                        routeStops.inbound
                };

            });

        return res.json({
            success: true,
            data
        });
    }
);

router.get(
    "/routes/:routeCode/geometry",
    async (req, res) => {

        const {
            routeCode
        } = req.params;

        const {
            direction
        } = req.query;

        if (
            direction !== "outbound" &&
            direction !== "inbound"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "direction 必須是 outbound 或 inbound"
            });

        }

        try {

            const data =
                await shuttleRouteGeometryService
                    .buildStopToStopGeometry({
                        routeCode,
                        direction
                    });

            return res.json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "[Shuttle Route Geometry] 取得 Geometry 失敗:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    }
);

module.exports = router;