window.ShuttleMonitorMap = (() => {

    let shuttleMap = null;

    let shuttleLabelOverlay = null;

    const shuttleMarkers = new Map();

    let displayMode = "all";

    let mapType = "roadmap";

    let outboundPolyline = null;
    let inboundPolyline = null;


    let shuttleRouteConfig = null;
    let shuttleRouteColor = "#22C55E";

    const SHUTTLE_ROUTE_COLOR_FALLBACK = "#7B4DFF";


    let shuttleMarkerColor = "#F02DAB";

    function setMarkerColor(color) {
        shuttleMarkerColor = color || "#F02DAB";

        for (const marker of shuttleMarkers.values()) {
            const markerElement = marker?.__shuttleMarkerElement;

            if (markerElement) {
                markerElement.style.setProperty(
                    "--shuttle-marker-color",
                    shuttleMarkerColor
                );
            }
        }
    }


    function setRouteConfig(config) {
        shuttleRouteConfig = config || null;

        if (config?.color) {
            shuttleRouteColor = config.color;
        } else {
            shuttleRouteColor = SHUTTLE_ROUTE_COLOR_FALLBACK;
        }
    }



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


    function createShuttleLabelOverlay(map) {
        class ShuttleLabelOverlay extends google.maps.OverlayView {
            constructor() {
                super();

                this.vehicles = new Map();
                this.labels = new Map();
                this.root = null;
                this.svg = null;
                this.lastLayoutKey = "";
            }

            onAdd() {
                this.root = document.createElement("div");
                this.root.className = "shuttle-label-overlay";

                this.svg = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "svg"
                );

                this.svg.classList.add("shuttle-leader-lines");
                this.root.appendChild(this.svg);

                // 直接使用地圖容器作為標籤層的定位基準
                map.getDiv().appendChild(this.root);

                // 補上圖層建立前已存在的車號
                for (const label of this.labels.values()) {
                    this.root.appendChild(label);
                }
            }

            updateVehicles(vehicles) {
                const next = new Map();

                vehicles.forEach(vehicle => {
                    next.set(vehicle.personnelNumber, vehicle);
                });

                this.vehicles = next;

                // 移除已不需要顯示的標籤
                for (const [id, element] of this.labels) {
                    if (!next.has(id)) {
                        element.remove();
                        this.labels.delete(id);
                    }
                }

                // 建立或更新標籤
                for (const [id, vehicle] of next) {
                    let label = this.labels.get(id);

                    if (!label) {
                        label = document.createElement("div");
                        label.className = "shuttle-label";

                        const warning = document.createElement("span");
                        warning.className = "shuttle-accuracy-warning";
                        warning.textContent = "⚠";

                        const text = document.createElement("span");
                        text.className = "shuttle-label-text";

                        label.append(warning, text);
                        this.root?.appendChild(label);

                        this.labels.set(id, label);

                        if (this.root && label.parentElement !== this.root) {
                            this.root.appendChild(label);
                        }
                    }

                    const text = label.querySelector(".shuttle-label-text");
                    const warning = label.querySelector(
                        ".shuttle-accuracy-warning"
                    );

                    text.textContent = window.getShuttleDisplayName?.(id) || id;

                    const accuracyStatus = vehicle.accuracyStatus;
                    const isOnline = vehicle.gpsStatus === "ONLINE";

                    label.classList.toggle(
                        "shuttle-marker-accuracy-warning",
                        isOnline && accuracyStatus === "WARNING"
                    );

                    label.classList.toggle(
                        "shuttle-marker-accuracy-poor",
                        isOnline && accuracyStatus === "POOR"
                    );

                    warning.style.display =
                        isOnline &&
                            (accuracyStatus === "WARNING" ||
                                accuracyStatus === "POOR")
                            ? "inline-block"
                            : "none";

                    warning.title =
                        accuracyStatus === "POOR"
                            ? `定位精度很差 ${formatAccuracy(vehicle.accuracy) || ""}`
                            : `定位精度偏低 ${formatAccuracy(vehicle.accuracy) || ""}`;

                    label.title =
                        vehicle.gpsStatus !== "ONLINE"
                            ? `${id}｜GPS ${vehicle.gpsStatus}`
                            : `${id}｜GPS ${formatAccuracy(vehicle.accuracy) || "ONLINE"}`;
                }

                this.lastLayoutKey = "";
                this.draw();
            }

            draw() {
                if (!this.root || !this.svg || !this.getProjection()) {
                    return;
                }

                const projection = this.getProjection();
                const mapDiv = map.getDiv();
                const width = mapDiv.clientWidth;
                const height = mapDiv.clientHeight;

                this.svg.setAttribute("width", width);
                this.svg.setAttribute("height", height);
                this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

                const entries = [];

                for (const [id, vehicle] of this.vehicles) {
                    const label = this.labels.get(id);

                    if (!label) continue;

                    const point = projection.fromLatLngToContainerPixel(
                        new google.maps.LatLng(
                            vehicle.position.lat,
                            vehicle.position.lng
                        )
                    );

                    if (!point) continue;

                    // 畫面外的標籤不參與排列
                    if (
                        point.x < -100 ||
                        point.y < -100 ||
                        point.x > width + 100 ||
                        point.y > height + 100
                    ) {
                        label.style.display = "none";
                        continue;
                    }

                    label.style.display = "inline-flex";

                    const rect = label.getBoundingClientRect();

                    entries.push({
                        id,
                        label,
                        x: point.x,
                        y: point.y,
                        w: Math.max(rect.width, 55),
                        h: Math.max(rect.height, 18)
                    });
                }

                // 依畫面位置排序，減少排版結果不穩定
                entries.sort((a, b) =>
                    a.y - b.y || a.x - b.x || a.id.localeCompare(b.id)
                );

                const placed = [];
                const lines = [];

                const gap = 4;
                const edge = 5;

                function overlapArea(a, b) {
                    const overlapX = Math.max(
                        0,
                        Math.min(a.right + gap, b.right + gap) -
                        Math.max(a.left - gap, b.left - gap)
                    );

                    const overlapY = Math.max(
                        0,
                        Math.min(a.bottom + gap, b.bottom + gap) -
                        Math.max(a.top - gap, b.top - gap)
                    );

                    return overlapX * overlapY;
                }

                function makeRect(x, y, w, h) {
                    return {
                        left: x,
                        top: y,
                        right: x + w,
                        bottom: y + h
                    };
                }

                function intersects(a, b) {
                    return (
                        a.left < b.right &&
                        a.right > b.left &&
                        a.top < b.bottom &&
                        a.bottom > b.top
                    );
                }

                function segmentsCross(a, b, c, d) {
                    const cross = (p, q, r) =>
                        (q.x - p.x) * (r.y - p.y) -
                        (q.y - p.y) * (r.x - p.x);

                    const ab1 = cross(a, b, c);
                    const ab2 = cross(a, b, d);
                    const cd1 = cross(c, d, a);
                    const cd2 = cross(c, d, b);

                    return ab1 * ab2 < 0 && cd1 * cd2 < 0;
                }

                for (const entry of entries) {
                    const { x, y, w, h } = entry;

                    // 優先靠近原定位點；發生重疊時再往其他位置尋找
                    const candidates = [
                        [x + 12, y - h / 2],
                        [x + 12, y - h - 7],
                        [x + 12, y + 7],
                        [x - w - 12, y - h / 2],
                        [x - w - 12, y - h - 7],
                        [x - w - 12, y + 7],
                        [x - w / 2, y - h - 12],
                        [x - w / 2, y + 12]
                    ];

                    // 密集區域增加候選位置，避免所有標籤擠在同一側
                    for (let ring = 1; ring <= 8; ring++) {
                        const offset = 12 + ring * 15;

                        candidates.push(
                            [x + offset, y - h / 2],
                            [x - w - offset, y - h / 2],
                            [x + 12, y - h / 2 - offset],
                            [x + 12, y + offset],
                            [x - w - 12, y - h / 2 - offset],
                            [x - w - 12, y + offset],
                            [x + offset, y - h - 7],
                            [x - w - offset, y + 7]
                        );
                    }

                    let best = null;
                    let bestScore = Infinity;

                    for (const [rawLeft, rawTop] of candidates) {
                        const left = Math.max(
                            edge,
                            Math.min(rawLeft, width - w - edge)
                        );

                        const top = Math.max(
                            edge,
                            Math.min(rawTop, height - h - edge)
                        );

                        const rect = makeRect(left, top, w, h);

                        let score = Math.hypot(
                            left + w / 2 - x,
                            top + h / 2 - y
                        );

                        for (const previous of placed) {
                            if (intersects(rect, previous.rect)) {
                                score += 100000 +
                                    overlapArea(rect, previous.rect) * 100;
                            }
                        }

                        const end = {
                            x: Math.max(left, Math.min(x, left + w)),
                            y: Math.max(top, Math.min(y, top + h))
                        };

                        for (const previousLine of lines) {
                            if (
                                segmentsCross(
                                    { x, y },
                                    end,
                                    previousLine.start,
                                    previousLine.end
                                )
                            ) {
                                score += 500;
                            }
                        }

                        if (score < bestScore) {
                            bestScore = score;
                            best = { left, top, rect, end };
                        }

                        // 已找到沒有重疊且距離近的位置，就不必繼續搜尋
                        if (
                            score < 100 &&
                            best &&
                            bestScore < 100
                        ) {
                            break;
                        }
                    }

                    if (!best) continue;

                    entry.label.style.left = `${best.left}px`;
                    entry.label.style.top = `${best.top}px`;

                    placed.push({
                        id: entry.id,
                        rect: best.rect
                    });

                    lines.push({
                        start: { x, y },
                        end: best.end
                    });
                }

                // 先清除舊引線，再繪製本次排列結果
                this.svg.replaceChildren();

                for (const line of lines) {
                    const distance = Math.hypot(
                        line.end.x - line.start.x,
                        line.end.y - line.start.y
                    );

                    if (distance < 8) continue;

                    const element = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "line"
                    );

                    element.setAttribute("x1", line.start.x);
                    element.setAttribute("y1", line.start.y);
                    element.setAttribute("x2", line.end.x);
                    element.setAttribute("y2", line.end.y);
                    element.setAttribute("class", "shuttle-leader-line");

                    this.svg.appendChild(element);
                }
            }

            onRemove() {
                this.svg?.remove();
                this.root?.remove();

                this.root = null;
                this.svg = null;

                this.labels.clear();
            }
        }

        const overlay = new ShuttleLabelOverlay();
        overlay.setMap(map);

        return overlay;
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

        shuttleLabelOverlay = createShuttleLabelOverlay(shuttleMap);

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

        const currentIds = new Set();
        const labelVehicles = [];

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

            labelVehicles.push({
                personnelNumber,
                position: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                accuracy,
                accuracyStatus,
                gpsStatus: location.gps_status
            });
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

        if (shuttleLabelOverlay) {
            shuttleLabelOverlay.updateVehicles(labelVehicles);
        }
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


    function createMarker(personnelNumber, position, gpsInfo = {}) {
        const markerElement = document.createElement("div");
        markerElement.className = "shuttle-marker";

        markerElement.style.setProperty(
            "--shuttle-marker-color",
            shuttleMarkerColor
        );

        const dot = document.createElement("span");
        dot.className = "shuttle-dot";

        markerElement.appendChild(dot);

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map: shuttleMap,
            position,
            content: markerElement,
            title: personnelNumber,
            anchorLeft: "-50%",
            anchorTop: "-50%"
        });

        marker.__shuttleMarkerElement = markerElement;
        marker.__shuttleDotElement = dot;

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
            marker?.__shuttleMarkerElement;

        if (!markerElement) {
            return;
        }

        // 使用目前函式實際收到的車輛編號，不引用未定義的 driver。
        const displayName =
            window.getShuttleDisplayName?.(personnelNumber) ||
            personnelNumber ||
            "未知車輛";

        const accuracyStatus =
            gpsInfo.accuracyStatus || "UNKNOWN";

        const accuracyText =
            formatAccuracy(gpsInfo.accuracy);

        const gpsStatus =
            gpsInfo.gpsStatus || "UNKNOWN";

        // 同步標記的標題，讓滑鼠移到車輛點位時能辨識車輛。
        marker.title = displayName;

        markerElement.classList.remove(
            "shuttle-marker-accuracy-warning",
            "shuttle-marker-accuracy-poor"
        );

        if (gpsStatus !== "ONLINE") {
            marker.title =
                `${displayName}｜GPS ${gpsStatus}`;

            marker.__shuttleLastAccuracyStatus =
                gpsStatus;

            return;
        }

        if (
            accuracyStatus === "NORMAL" ||
            accuracyStatus === "UNKNOWN"
        ) {
            marker.title = accuracyText
                ? `${displayName}｜GPS ${accuracyText}`
                : `${displayName}｜GPS ONLINE`;

            marker.__shuttleLastAccuracyStatus =
                accuracyStatus;

            return;
        }

        if (accuracyStatus === "WARNING") {
            markerElement.classList.add(
                "shuttle-marker-accuracy-warning"
            );

            marker.title =
                `${displayName}｜⚠ 定位精度偏低 ${accuracyText || ""}`;

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

        if (accuracyStatus === "POOR") {
            markerElement.classList.add(
                "shuttle-marker-accuracy-poor"
            );

            marker.title =
                `${displayName}｜🔴 定位精度很差 ${accuracyText || ""}`;

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

            outboundPolyline = drawRoute(
                outbound,
                shuttleRouteColor,
                "Outbound 去程"
            );
        }


        // ========================================
        // 回程
        // ========================================

        if (inbound) {

            inboundPolyline = drawRoute(
                inbound,
                shuttleRouteColor,
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
        shuttleMarkers.forEach(marker => {
            marker.map = null;
        });

        shuttleMarkers.clear();

        if (shuttleLabelOverlay) {
            shuttleLabelOverlay.setMap(null);
            shuttleLabelOverlay = null;
        }

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
        setRouteConfig,
        setMarkerColor,
        setGeometry,
        cleanup
    };

})();