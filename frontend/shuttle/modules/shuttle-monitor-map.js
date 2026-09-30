window.ShuttleMonitorMap = (() => {

    let shuttleMap = null;

    const shuttleMarkers = new Map();

    let displayMode = "all";

    let routePolyline = null;

    // ========================================
    // Map Initialization
    // ========================================

    async function init() {

        if (shuttleMap) {
            return;
        }

        if (!window.google || !google.maps) {

            console.error(
                "[Shuttle Monitor Map] Google Maps 尚未載入"
            );

            return;
        }

        await google.maps.importLibrary("marker");

        const targetLocation = {
            lat: 24.239268,
            lng: 120.623498
        };

        shuttleMap = new google.maps.Map(
            document.getElementById("shuttleMap"),
            {
                center: targetLocation,
                zoom: 14,
                mapId: "4226f603895ec596617ae2e5",
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                gestureHandling: "greedy"
            }
        );

        console.log(
            "[Shuttle Monitor Map] Google Maps 初始化完成"
        );
    }


    // ========================================
    // Render A Route
    // ========================================

    function renderLocations(locations) {

        if (!shuttleMap) {
            return;
        }

        const currentIds =
            new Set();

        locations.forEach(location => {

            const personnelNumber =
                location.personnel_number;

            if (
                typeof personnelNumber !==
                "string"
            ) {
                return;
            }

            if (
                typeof location.latitude !==
                "number" ||
                typeof location.longitude !==
                "number"
            ) {
                return;
            }

            // ========================================
            // Map Display Filter
            // ========================================

            if (
                displayMode === "online" &&
                location.gps_status !== "ONLINE"
            ) {
                return;
            }

            currentIds.add(
                personnelNumber
            );

            updateMarker(
                personnelNumber,
                location.latitude,
                location.longitude
            );
        });


        // ========================================
        // Remove Hidden / Missing Markers
        // ========================================

        shuttleMarkers.forEach(
            (
                marker,
                personnelNumber
            ) => {

                if (
                    !currentIds.has(
                        personnelNumber
                    )
                ) {

                    marker.map = null;

                    shuttleMarkers.delete(
                        personnelNumber
                    );
                }
            }
        );
    }


    // ========================================
    // Create / Update Marker
    // ========================================

    function updateMarker(
        personnelNumber,
        latitude,
        longitude
    ) {

        const position = {
            lat: latitude,
            lng: longitude
        };

        let marker =
            shuttleMarkers.get(
                personnelNumber
            );

        if (!marker) {

            marker =
                createMarker(
                    personnelNumber,
                    position
                );

            shuttleMarkers.set(
                personnelNumber,
                marker
            );

            return;
        }

        marker.position =
            position;
    }


    // ========================================
    // Create Shuttle Marker
    // ========================================

    function createMarker(
        personnelNumber,
        position
    ) {

        const markerElement =
            document.createElement(
                "div"
            );

        markerElement.className =
            "shuttle-marker";


        const dot =
            document.createElement(
                "span"
            );

        dot.className =
            "shuttle-dot";


        const label =
            document.createElement(
                "span"
            );

        label.className =
            "shuttle-label";


        label.textContent =
            personnelNumber;


        markerElement.appendChild(
            dot
        );

        markerElement.appendChild(
            label
        );


        const marker =
            new google.maps.marker.AdvancedMarkerElement({
                map: shuttleMap,
                position,
                content: markerElement,
                title: personnelNumber
            });

        return marker;
    }


    // ========================================
    // Display Mode
    // ========================================

    function setDisplayMode(mode) {

        if (
            mode !== "all" &&
            mode !== "online"
        ) {
            return;
        }

        displayMode =
            mode;
    }


    function getDisplayMode() {

        return displayMode;
    }


    // ========================================
    // Cleanup
    // ========================================

    function cleanup() {

        shuttleMarkers.forEach(
            marker => {
                marker.map = null;
            }
        );

        shuttleMarkers.clear();

        shuttleMap = null;
    }

    function setRoute(routeData) {

        if (!routeData) {
            console.warn(
                "[Shuttle Monitor Map] 沒有路線資料"
            );
            return;
        }

        console.log(
            "[Shuttle Monitor Map] 路線設定:",
            routeData.routeCode,
            routeData.routeName
        );

        console.log(
            "[Shuttle Monitor Map] 去程站點:",
            routeData.outbound
        );

        console.log(
            "[Shuttle Monitor Map] 回程站點:",
            routeData.inbound
        );
    }

    function setGeometry(geometry) {

        if (!map) {
            console.warn(
                "[Shuttle Monitor Map] Map 尚未初始化"
            );
            return;
        }

        if (
            !geometry ||
            geometry.type !== "MultiLineString" ||
            !Array.isArray(geometry.coordinates)
        ) {
            console.warn(
                "[Shuttle Monitor Map] Geometry 格式錯誤:",
                geometry
            );
            return;
        }

        // 清除舊路線
        if (routePolyline) {
            routePolyline.setMap(null);
            routePolyline = null;
        }

        const path = [];

        geometry.coordinates.forEach(
            lineString => {

                if (!Array.isArray(lineString)) {
                    return;
                }

                lineString.forEach(
                    coordinate => {

                        if (
                            !Array.isArray(coordinate) ||
                            coordinate.length < 2
                        ) {
                            return;
                        }

                        const [
                            longitude,
                            latitude
                        ] = coordinate;

                        path.push({
                            lat: latitude,
                            lng: longitude
                        });

                    }
                );

            }
        );

        if (!path.length) {

            console.warn(
                "[Shuttle Monitor Map] Geometry 沒有座標"
            );

            return;
        }

        routePolyline =
            new google.maps.Polyline({

                path,

                geodesic: false,

                strokeColor: "#f59e0b",

                strokeOpacity: 0.9,

                strokeWeight: 5

            });

        routePolyline.setMap(map);

        console.log(
            "[Shuttle Monitor Map] Geometry 已繪製:",
            path.length,
            "points"
        );

    }

    return {
        init,
        renderLocations,
        setDisplayMode,
        getDisplayMode,
        setRoute,
        setGeometry,
        cleanup
    };

})();