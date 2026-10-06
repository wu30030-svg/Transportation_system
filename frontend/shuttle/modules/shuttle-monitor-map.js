window.ShuttleMonitorMap = (() => {

    let shuttleMap = null;

    const shuttleMarkers = new Map();

    let displayMode = "all";

    let mapType = "roadmap";

    let outboundPolyline = null;
    let inboundPolyline = null;


    // ========================================
    // GPS Accuracy Threshold
    // ========================================

    const GPS_ACCURACY_NORMAL_METERS = 100;

    const GPS_ACCURACY_WARNING_METERS = 500;


    // ========================================
    // GPS Accuracy Status
    // ========================================

    function getAccuracyStatus(accuracy) {

        const numericAccuracy =
            Number(accuracy);


        if (!Number.isFinite(numericAccuracy)) {

            return "UNKNOWN";
        }


        // ========================================
        // 正常
        // ========================================

        if (
            numericAccuracy <=
            GPS_ACCURACY_NORMAL_METERS
        ) {

            return "NORMAL";
        }


        // ========================================
        // 精度偏低
        // ========================================

        if (
            numericAccuracy <=
            GPS_ACCURACY_WARNING_METERS
        ) {

            return "WARNING";
        }


        // ========================================
        // 精度很差
        // ========================================

        return "POOR";
    }


    // ========================================
    // Format GPS Accuracy
    // ========================================

    function formatAccuracy(accuracy) {

        const numericAccuracy =
            Number(accuracy);


        if (!Number.isFinite(numericAccuracy)) {

            return null;
        }


        return `±${Math.round(numericAccuracy)}m`;
    }


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
                mapTypeId: "roadmap",
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
    // Render Shuttle Locations
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


            // ========================================
            // GPS Accuracy
            // ========================================

            const accuracy =
                Number(location.accuracy);

            const accuracyStatus =
                getAccuracyStatus(
                    accuracy
                );


            updateMarker(
                personnelNumber,
                location.latitude,
                location.longitude,
                {
                    accuracy,
                    accuracyStatus,
                    gpsStatus:
                        location.gps_status
                }
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
        longitude,
        gpsInfo = {}
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
                    position,
                    gpsInfo
                );

            shuttleMarkers.set(
                personnelNumber,
                marker
            );

            return;
        }


        marker.position =
            position;


        // ========================================
        // Update Existing Marker
        // ========================================

        updateMarkerAppearance(
            marker,
            personnelNumber,
            gpsInfo
        );
    }


    // ========================================
    // Create Shuttle Marker
    // ========================================

    function createMarker(
        personnelNumber,
        position,
        gpsInfo = {}
    ) {

        const markerElement =
            document.createElement(
                "div"
            );

        markerElement.className =
            "shuttle-marker";


        // ========================================
        // Vehicle Dot
        // ========================================

        const dot =
            document.createElement(
                "span"
            );

        dot.className =
            "shuttle-dot";


        // ========================================
        // Vehicle Label
        // ========================================

        const label =
            document.createElement(
                "span"
            );

        label.className =
            "shuttle-label";

        label.textContent =
            personnelNumber;


        // ========================================
        // Accuracy Warning
        // ========================================

        const warning =
            document.createElement(
                "span"
            );

        warning.className =
            "shuttle-accuracy-warning";

        warning.textContent =
            "⚠";


        // ========================================
        // Append
        // ========================================

        markerElement.appendChild(
            dot
        );

        markerElement.appendChild(
            label
        );

        markerElement.appendChild(
            warning
        );


        const marker =
            new google.maps.marker.AdvancedMarkerElement({
                map: shuttleMap,
                position,
                content: markerElement,
                title: personnelNumber
            });


        // ========================================
        // Initial Appearance
        // ========================================

        marker.__shuttleMarkerElement =
            markerElement;

        marker.__shuttleWarningElement =
            warning;

        marker.__shuttleDotElement =
            dot;

        marker.__shuttleLabelElement =
            label;


        updateMarkerAppearance(
            marker,
            personnelNumber,
            gpsInfo
        );


        return marker;
    }


    // ========================================
    // Update Marker Appearance
    // ========================================

    function updateMarkerAppearance(
        marker,
        personnelNumber,
        gpsInfo = {}
    ) {

        const markerElement =
            marker.__shuttleMarkerElement;

        const warningElement =
            marker.__shuttleWarningElement;


        if (!markerElement) {
            return;
        }


        const accuracyStatus =
            gpsInfo.accuracyStatus ||
            "UNKNOWN";

        const accuracy =
            gpsInfo.accuracy;

        const gpsStatus =
            gpsInfo.gpsStatus ||
            "UNKNOWN";

        const accuracyText =
            formatAccuracy(
                accuracy
            );


        // ========================================
        // Reset
        // ========================================

        markerElement.classList.remove(
            "shuttle-marker-accuracy-warning"
        );

        markerElement.classList.remove(
            "shuttle-marker-accuracy-poor"
        );

        if (warningElement) {

            warningElement.style.display =
                "none";

            warningElement.title =
                "";
        }


        // ========================================
        // OFFLINE
        //
        // 離線車輛保留最後位置
        // 但不判斷 GPS Accuracy
        // ========================================

        if (
            gpsStatus !== "ONLINE"
        ) {

            marker.title =
                `${personnelNumber}｜GPS ${gpsStatus}`;

            return;
        }


        // ========================================
        // ONLINE
        // ========================================

        // ----------------------------------------
        // Normal / Unknown
        // ----------------------------------------

        if (
            accuracyStatus === "NORMAL" ||
            accuracyStatus === "UNKNOWN"
        ) {

            marker.title =
                accuracyText
                    ? `${personnelNumber}｜GPS ${accuracyText}`
                    : `${personnelNumber}｜GPS ONLINE`;

            return;
        }


        // ========================================
        // Accuracy Warning
        // 101m ~ 500m
        // ========================================

        if (
            accuracyStatus === "WARNING"
        ) {

            markerElement.classList.add(
                "shuttle-marker-accuracy-warning"
            );


            if (warningElement) {

                warningElement.style.display =
                    "inline-block";

                warningElement.title =
                    `定位精度偏低 ${accuracyText || ""}`;
            }


            marker.title =
                `${personnelNumber}｜⚠ 定位精度偏低 ${accuracyText || ""}`;


            // ------------------------------------
            // 只在狀態改變時寫入 Console
            // ------------------------------------

            if (
                marker.__shuttleLastAccuracyStatus !==
                "WARNING"
            ) {

                console.warn(
                    "[Shuttle Monitor Map] 定位精度偏低:",
                    personnelNumber,
                    accuracyText
                );
            }


            marker.__shuttleLastAccuracyStatus =
                "WARNING";

            return;
        }


        // ========================================
        // Accuracy Poor
        // > 500m
        // ========================================

        if (
            accuracyStatus === "POOR"
        ) {

            markerElement.classList.add(
                "shuttle-marker-accuracy-poor"
            );


            if (warningElement) {

                warningElement.style.display =
                    "inline-block";

                warningElement.title =
                    `定位精度很差 ${accuracyText || ""}`;
            }


            marker.title =
                `${personnelNumber}｜🔴 定位精度很差 ${accuracyText || ""}`;


            // ------------------------------------
            // 只在狀態改變時寫入 Console
            // ------------------------------------

            if (
                marker.__shuttleLastAccuracyStatus !==
                "POOR"
            ) {

                console.warn(
                    "[Shuttle Monitor Map] 定位精度很差:",
                    personnelNumber,
                    accuracyText
                );
            }


            marker.__shuttleLastAccuracyStatus =
                "POOR";

            return;
        }


        // ========================================
        // 記錄目前狀態
        // ========================================

        marker.__shuttleLastAccuracyStatus =
            accuracyStatus;

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
    // Route Cleanup
    // ========================================

    function cleanupRoute() {

        if (outboundPolyline) {

            outboundPolyline.setMap(
                null
            );

            outboundPolyline =
                null;
        }


        if (inboundPolyline) {

            inboundPolyline.setMap(
                null
            );

            inboundPolyline =
                null;
        }
    }


    // ========================================
    // Convert Geometry → Google Maps Path
    // ========================================

    function geometryToPath(
        geometry
    ) {

        if (
            !geometry ||
            geometry.type !==
            "MultiLineString" ||
            !Array.isArray(
                geometry.coordinates
            )
        ) {

            return [];
        }

        const path = [];

        geometry.coordinates.forEach(
            lineString => {

                if (
                    !Array.isArray(
                        lineString
                    )
                ) {
                    return;
                }

                lineString.forEach(
                    coordinate => {

                        if (
                            !Array.isArray(
                                coordinate
                            ) ||
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

        return path;
    }


    // ========================================
    // Draw One Route
    // ========================================

    function drawRoute(
        geometry,
        color,
        direction
    ) {

        const path =
            geometryToPath(
                geometry
            );

        if (!path.length) {

            console.warn(
                `[Shuttle Monitor Map] ${direction} Geometry 沒有座標`
            );

            return null;
        }

        const polyline =
            new google.maps.Polyline({

                path,

                geodesic: false,

                strokeColor:
                    color,

                strokeOpacity: 0.9,

                strokeWeight: 5

            });

        polyline.setMap(
            shuttleMap
        );

        console.log(
            `[Shuttle Monitor Map] ${direction} Geometry 已繪製:`,
            path.length,
            "points"
        );

        return polyline;
    }


    // ========================================
    // Route Data
    // ========================================

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


    // ========================================
    // Route Geometry
    // ========================================

    function setGeometry(
        geometries
    ) {

        if (!shuttleMap) {

            console.warn(
                "[Shuttle Monitor Map] Map 尚未初始化"
            );

            return;
        }


        // ========================================
        // 新 Geometry 格式
        //
        // {
        //     outbound: {...},
        //     inbound: {...}
        // }
        // ========================================

        if (
            !geometries ||
            typeof geometries !== "object"
        ) {

            console.warn(
                "[Shuttle Monitor Map] Geometry 資料不存在:",
                geometries
            );

            return;
        }


        const outbound =
            geometries.outbound;

        const inbound =
            geometries.inbound;


        // ========================================
        // Debug
        // ========================================

        if (outbound) {

            console.log(
                "[DEBUG] Outbound Geometry 座標數:",
                outbound.coordinates
                    ?.reduce(
                        (
                            total,
                            line
                        ) =>
                            total +
                            (
                                Array.isArray(line)
                                    ? line.length
                                    : 0
                            ),
                        0
                    )
            );
        }


        if (inbound) {

            console.log(
                "[DEBUG] Inbound Geometry 座標數:",
                inbound.coordinates
                    ?.reduce(
                        (
                            total,
                            line
                        ) =>
                            total +
                            (
                                Array.isArray(line)
                                    ? line.length
                                    : 0
                            ),
                        0
                    )
            );
        }


        // ========================================
        // 清除舊路線
        // ========================================

        cleanupRoute();


        // ========================================
        // 去程
        // ========================================

        if (outbound) {

            outboundPolyline =
                drawRoute(
                    outbound,
                    "#f59e0b",
                    "Outbound 去程"
                );
        }


        // ========================================
        // 回程
        // ========================================

        if (inbound) {

            inboundPolyline =
                drawRoute(
                    inbound,
                    "#60a5fa",
                    "Inbound 回程"
                );
        }


        // ========================================
        // 完成
        // ========================================

        console.log(
            "[Shuttle Monitor Map] 去程 + 回程 Geometry 繪製完成"
        );
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


        cleanupRoute();


        shuttleMap = null;
    }

    // ========================================
    // Map Type
    // ========================================

    function setMapType(type) {

        if (
            type !== "roadmap" &&
            type !== "satellite" &&
            type !== "hybrid"
        ) {
            return;
        }

        if (!shuttleMap) {
            console.warn(
                "[Shuttle Monitor Map] Map 尚未初始化"
            );

            return;
        }

        mapType = type;

        shuttleMap.setMapTypeId(
            type
        );

        console.log(
            "[Shuttle Monitor Map] 地圖底圖已切換:",
            type
        );
    }


    function getMapType() {

        return mapType;
    }

    // ========================================
    // Public API
    // ========================================

    return {

        init,

        renderLocations,

        setDisplayMode,

        getDisplayMode,

        setMapType,

        getMapType,

        setRoute,

        setGeometry,

        cleanup

    };

})();