/**
 * ========================================
 * Tracking System
 * ========================================
 *
 * 負責：
 * 1. 多人定位
 * 2. 車輛定位
 * 3. 手機 GPS
 * 4. 模擬定位
 * 5. Tracking Marker Rendering
 *
 * 不負責：
 * - 任務生命週期
 * - 路線規劃
 * - CCTV
 * - PostgreSQL
 *
 * 第一版：
 * Frontend Local Tracking
 *
 * 未來：
 * Tracking API → Backend → PostgreSQL
 * ========================================
 */


// ========================================
// Tracking State
// ========================================

let trackingInitialized = false;

let trackingSimulationTimer = null;

let trackingSimulationRunning = false;

let trackingPhoneWatchId = null;

const trackingEntities = new Map();

const trackingVehicleMarkers = new Map();

let trackingMissionLocationTimer = null;

const TRACKING_MISSION_LOCATION_INTERVAL = 5000;

// ========================================
// Configuration
// ========================================

const TRACKING_API_BASE =
    `${CONFIG.API_BASE_URL}/api/tracking`;

const TRACKING_SIMULATION_INTERVAL = 1000;

const TRACKING_SIMULATION_PROGRESS = 0.15;

const TRACKING_SIMULATION_SPEED = 0.0025;

// ========================================
// Initialize
// ========================================

function initTracking() {

    if (trackingInitialized) {

        console.log(
            "[Tracking] Tracking 已初始化。"
        );

        return;

    }


    if (
        typeof executionMap === "undefined" ||
        !executionMap
    ) {

        console.warn(
            "[Tracking] executionMap 尚未初始化。"
        );

        return;

    }


    createTrackingControls();

    trackingInitialized = true;


    console.log(
        "[Tracking] Tracking System 初始化完成。"
    );


    // ========================================
    // 載入目前 Mission 的車隊位置
    // ========================================

    if (
        typeof startMissionLocationPolling ===
        "function"
    ) {

        startMissionLocationPolling();

    }

}


// ========================================
// Tracking Control UI
// ========================================

function createTrackingControls() {

    const mapContainer =
        document.querySelector(
            ".execution-map-container"
        );


    if (!mapContainer) {

        console.warn(
            "[Tracking] 找不到 execution-map-container。"
        );

        return;

    }


    if (
        document.getElementById(
            "tracking-control-panel"
        )
    ) {

        return;

    }


    // ========================================
    // Tracking Toggle Point
    // ========================================

    const toggle =
        document.createElement("button");

    toggle.id =
        "tracking-toggle-button";

    toggle.type =
        "button";

    toggle.className =
        "tracking-toggle-button";

    toggle.title =
        "定位追蹤";

    toggle.setAttribute(
        "aria-label",
        "開啟定位追蹤"
    );

    toggle.innerHTML = `
        <span class="tracking-toggle-icon">
            📍
        </span>
    `;


    // ========================================
    // Tracking Control Panel
    // ========================================

    const panel =
        document.createElement("div");

    panel.id =
        "tracking-control-panel";

    panel.className =
        "tracking-panel-hidden";


    panel.innerHTML = `

        <div class="tracking-control-header">

            <div>
                <span class="tracking-eyebrow">
                    定位追蹤
                </span>

                <strong>
                    Tracking
                </strong>
            </div>


            <div
                class="tracking-header-actions"
            >

                <span
                    id="tracking-status"
                    class="tracking-status"
                >
                    OFFLINE
                </span>


                <button
                    id="tracking-panel-close"
                    type="button"
                    class="tracking-panel-close"
                    title="關閉定位追蹤"
                    aria-label="關閉定位追蹤"
                >
                    ×
                </button>

            </div>

        </div>


        <div class="tracking-control-body">

            <button
                id="tracking-simulation-start"
                type="button"
                class="tracking-button tracking-button-primary"
            >
                ▶ 啟動模擬
            </button>


            <button
                id="tracking-simulation-stop"
                type="button"
                class="tracking-button"
            >
                ■ 停止模擬
            </button>


            <button
                id="tracking-phone-start"
                type="button"
                class="tracking-button"
            >
                📱 啟用手機 GPS
            </button>


            <button
                id="tracking-clear"
                type="button"
                class="tracking-button tracking-button-danger"
            >
                清除定位
            </button>


            <div
                id="tracking-entity-list"
                class="tracking-entity-list"
            >
            </div>

        </div>
    `;


    mapContainer.appendChild(toggle);

    mapContainer.appendChild(panel);


    injectTrackingStyles();


    // ========================================
    // Toggle Panel
    // ========================================

    function toggleTrackingPanel() {

        const isOpen =
            panel.classList.contains(
                "tracking-panel-visible"
            );


        if (isOpen) {

            panel.classList.remove(
                "tracking-panel-visible"
            );

            panel.classList.add(
                "tracking-panel-hidden"
            );

            toggle.classList.remove(
                "active"
            );

            toggle.setAttribute(
                "aria-label",
                "開啟定位追蹤"
            );

        } else {

            panel.classList.remove(
                "tracking-panel-hidden"
            );

            panel.classList.add(
                "tracking-panel-visible"
            );

            toggle.classList.add(
                "active"
            );

            toggle.setAttribute(
                "aria-label",
                "關閉定位追蹤"
            );

        }

    }


    toggle.addEventListener(
        "click",
        toggleTrackingPanel
    );


    document
        .getElementById(
            "tracking-panel-close"
        )
        ?.addEventListener(
            "click",
            toggleTrackingPanel
        );


    // ========================================
    // Tracking Actions
    // ========================================

    document
        .getElementById(
            "tracking-simulation-start"
        )
        ?.addEventListener(
            "click",
            startTrackingSimulation
        );


    document
        .getElementById(
            "tracking-simulation-stop"
        )
        ?.addEventListener(
            "click",
            stopTrackingSimulation
        );


    document
        .getElementById(
            "tracking-phone-start"
        )
        ?.addEventListener(
            "click",
            startPhoneTracking
        );


    document
        .getElementById(
            "tracking-clear"
        )
        ?.addEventListener(
            "click",
            clearAllTracking
        );

}

// ========================================
// Tracking Styles
// ========================================

function injectTrackingStyles() {

    if (
        document.getElementById(
            "tracking-system-styles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "tracking-system-styles";


    style.textContent = `

        /* ========================================
           Tracking Toggle Point
           ======================================== */

        #tracking-toggle-button {

            position: absolute;

            left: 16px;

            top: 16px;

            width: 44px;

            height: 44px;

            z-index: 26;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 0;

            border:
                1px solid
                var(--border);

            border-radius: 50%;

            background:
                rgba(20, 20, 20, 0.94);

            backdrop-filter:
                blur(10px);

            box-shadow:
                0 8px 20px
                rgba(0, 0, 0, 0.35);

            color:
                var(--text-primary);

            cursor: pointer;

            transition:
                transform .15s ease,
                background .15s ease,
                border-color .15s ease,
                box-shadow .15s ease;

        }


        #tracking-toggle-button:hover {

            transform:
                translateY(-1px);

            background:
                rgba(35, 35, 35, 0.96);

        }


        #tracking-toggle-button.active {

            border-color:
                var(--amber);

            box-shadow:
                0 0 0 3px
                rgba(255, 180, 60, 0.12),
                0 8px 20px
                rgba(0, 0, 0, 0.35);

        }


        .tracking-toggle-icon {

            font-size: 21px;

            line-height: 1;

        }


        /* ========================================
           Tracking Control Panel
           ======================================== */

        #tracking-control-panel {

            position: absolute;

            left: 16px;

            top: 70px;

            width: 270px;

            z-index: 25;

            border:
                1px solid
                var(--border);

            border-radius:
                var(--radius-lg, 12px);

            background:
                rgba(20, 20, 20, 0.94);

            backdrop-filter:
                blur(10px);

            box-shadow:
                0 12px 30px
                rgba(0, 0, 0, 0.35);

            overflow: hidden;

            color:
                var(--text-primary);

            transition:
                opacity .15s ease,
                transform .15s ease,
                visibility .15s ease;

            transform-origin:
                top left;

        }


        #tracking-control-panel.tracking-panel-hidden {

            opacity: 0;

            visibility: hidden;

            pointer-events: none;

            transform:
                translateY(-6px)
                scale(.98);

        }


        #tracking-control-panel.tracking-panel-visible {

            opacity: 1;

            visibility: visible;

            pointer-events: auto;

            transform:
                translateY(0)
                scale(1);

        }


        /* ========================================
           Header
           ======================================== */

        .tracking-control-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 14px 12px 14px 16px;

            border-bottom:
                1px solid
                var(--border);

        }


        .tracking-eyebrow {

            display: block;

            margin-bottom: 3px;

            font-size: 10px;

            letter-spacing: 0.12em;

            color:
                var(--text-tertiary);

            text-transform: uppercase;

        }


        .tracking-header-actions {

            display: flex;

            align-items: center;

            gap: 7px;

        }


        .tracking-status {

            padding:
                4px 8px;

            border-radius: 999px;

            font-family:
                "JetBrains Mono",
                monospace;

            font-size: 10px;

            font-weight: 700;

            background:
                rgba(120, 120, 120, 0.18);

            color:
                var(--text-secondary);

        }


        .tracking-status.active {

            background:
                rgba(50, 180, 100, 0.18);

            color:
                var(--success);

        }


        .tracking-panel-close {

            width: 26px;

            height: 26px;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 0;

            border: 0;

            border-radius: 6px;

            background:
                transparent;

            color:
                var(--text-secondary);

            font-size: 20px;

            line-height: 1;

            cursor: pointer;

            transition:
                background .15s ease,
                color .15s ease;

        }


        .tracking-panel-close:hover {

            background:
                rgba(255, 255, 255, 0.08);

            color:
                var(--text-primary);

        }


        /* ========================================
           Body
           ======================================== */

        .tracking-control-body {

            display: flex;

            flex-direction: column;

            gap: 8px;

            padding: 12px;

        }


        .tracking-button {

            width: 100%;

            padding: 9px 12px;

            border:
                1px solid
                var(--border);

            border-radius: 8px;

            background:
                var(--card);

            color:
                var(--text-primary);

            cursor: pointer;

            text-align: left;

            transition:
                background .15s ease,
                border-color .15s ease;

        }


        .tracking-button:hover {

            background:
                var(--panel);

        }


        .tracking-button-primary {

            border-color:
                var(--amber);

            color:
                var(--amber);

        }


        .tracking-button-danger {

            color:
                var(--danger);

        }


        /* ========================================
           Entity List
           ======================================== */

        .tracking-entity-list {

            display: flex;

            flex-direction: column;

            gap: 5px;

            margin-top: 4px;

            padding-top: 10px;

            border-top:
                1px solid
                var(--border);

        }


        .tracking-entity {

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 7px 8px;

            border-radius: 6px;

            background:
                rgba(255, 255, 255, 0.035);

            font-size: 12px;

        }


        .tracking-entity-name {

            display: flex;

            align-items: center;

            gap: 7px;

        }


        .tracking-entity-type {

            font-family:
                "JetBrains Mono",
                monospace;

            font-size: 9px;

            color:
                var(--text-tertiary);

        }

    `;


    document.head.appendChild(style);

}

// ========================================
// Marker Creation
// ========================================

function createTrackingMarker(entity) {

    if (
        typeof google === "undefined" ||
        !google.maps ||
        !google.maps.marker
    ) {

        console.warn(
            "[Tracking] Google Maps Marker Library 尚未載入。"
        );

        return null;

    }


    const markerElement =
        document.createElement("div");


    markerElement.style.width = "38px";

    markerElement.style.height = "38px";

    markerElement.style.borderRadius = "50%";

    markerElement.style.display = "flex";

    markerElement.style.alignItems = "center";

    markerElement.style.justifyContent = "center";

    markerElement.style.background =
        "rgba(20,20,20,0.92)";

    markerElement.style.border =
        "2px solid var(--amber)";

    markerElement.style.boxShadow =
        "0 3px 12px rgba(0,0,0,.45)";

    markerElement.style.fontSize = "20px";

    markerElement.textContent =
        entity.icon || "📍";


    const marker =
        new google.maps.marker.AdvancedMarkerElement({

            map: executionMap,

            position: entity.position,

            content: markerElement,

            title: entity.name

        });


    return marker;

}


// ========================================
// Simulation
// ========================================

function startTrackingSimulation() {

    if (!executionMap) {

        alert(
            "執行地圖尚未初始化。"
        );

        return;

    }


    if (
        !currentMission ||
        currentMission.status !== "RUNNING"
    ) {

        alert(
            "只有正在執行的 Mission 才能啟動定位模擬。"
        );

        return;

    }


    if (!currentMissionRun) {

        alert(
            "找不到目前的 Mission Run。"
        );

        return;

    }


    if (
        typeof executionRoutePolyline ===
        "undefined" ||
        !executionRoutePolyline
    ) {

        alert(
            "目前沒有已確認的執行路線。"
        );

        return;

    }


    const routePath =
        executionRoutePolyline.getPath();


    if (
        !routePath ||
        routePath.getLength() < 2
    ) {

        alert(
            "執行路線資料不足，無法啟動模擬。"
        );

        return;

    }


    if (trackingSimulationRunning) {

        console.log(
            "[Tracking Simulation] 模擬已經在執行。"
        );

        return;

    }


    trackingSimulationRunning = true;


    let tracked =
        trackingEntities.get(
            "phone-user"
        );


    if (!tracked) {

        const position =
            getSimulationPosition(
                TRACKING_SIMULATION_PROGRESS
            );


        const marker =
            createTrackingMarker({

                id:
                    "phone-user",

                name:
                    "模擬定位",

                type:
                    "SIMULATION",

                icon:
                    "📱",

                position

            });


        tracked = {

            id:
                "phone-user",

            name:
                "模擬定位",

            type:
                "SIMULATION",

            icon:
                "📱",

            progress:
                TRACKING_SIMULATION_PROGRESS,

            position,

            marker

        };


        trackingEntities.set(
            "phone-user",
            tracked
        );

    }


    updateTrackingEntityList();

    updateTrackingStatus();


    updateSimulationPositions();


    trackingSimulationTimer =
        setInterval(
            updateSimulationPositions,
            TRACKING_SIMULATION_INTERVAL
        );


    console.log(
        "[Tracking Simulation] 模擬啟動。"
    );

}


// ========================================
// Update Simulation
// ========================================

async function updateSimulationPositions() {

    if (
        !trackingSimulationRunning
    ) {

        return;

    }


    const tracked =
        trackingEntities.get(
            "phone-user"
        );


    if (!tracked) {

        return;

    }


    tracked.progress =
        (
            tracked.progress +
            TRACKING_SIMULATION_SPEED
        ) % 1;


    const position =
        getSimulationPosition(
            tracked.progress
        );


    tracked.position =
        position;


    if (tracked.marker) {

        tracked.marker.position =
            position;

    }


    updateTrackingEntityList();


    const result =
        await recordTrackingLocation({

            lat:
                position.lat,

            lng:
                position.lng,

            accuracy:
                5

        });


    if (result) {

        await loadCurrentMissionLocations();

    }


    console.log(
        "[Tracking Simulation] 位置更新:",
        position
    );

}


// ========================================
// Get Position From Mission Route
// ========================================

function getSimulationPosition(progress) {

    let routePath = null;


    try {

        if (
            typeof executionRoutePolyline !==
            "undefined" &&
            executionRoutePolyline
        ) {

            routePath =
                executionRoutePolyline.getPath();

        }

    } catch (error) {

        console.warn(
            "[Tracking] 無法取得任務路線:",
            error
        );

    }


    if (
        !routePath ||
        routePath.getLength() < 2
    ) {

        console.warn(
            "[Tracking Simulation] 找不到有效執行路線。"
        );

        return {
            lat: 24.239268,
            lng: 120.623498
        };

    }


    const totalSegments =
        routePath.getLength() - 1;


    const exactIndex =
        progress * totalSegments;


    const index =
        Math.floor(exactIndex);


    const nextIndex =
        Math.min(
            index + 1,
            totalSegments
        );


    const localProgress =
        exactIndex - index;


    const pointA =
        routePath.getAt(index);


    const pointB =
        routePath.getAt(nextIndex);


    return {

        lat:
            pointA.lat() +
            (
                pointB.lat() -
                pointA.lat()
            ) *
            localProgress,

        lng:
            pointA.lng() +
            (
                pointB.lng() -
                pointA.lng()
            ) *
            localProgress

    };

}


// ========================================
// Stop Simulation
// ========================================

function stopTrackingSimulation() {

    trackingSimulationRunning = false;


    if (trackingSimulationTimer) {

        clearInterval(
            trackingSimulationTimer
        );

        trackingSimulationTimer = null;

    }


    removeSimulationEntities();


    updateTrackingEntityList();

    updateTrackingStatus();


    console.log(
        "[Tracking Simulation] 模擬停止。"
    );

}

function removeSimulationEntities() {

    const tracked =
        trackingEntities.get(
            "phone-user"
        );


    if (!tracked) {

        return;

    }


    if (tracked.marker) {

        tracked.marker.map = null;

    }


    trackingEntities.delete(
        "phone-user"
    );

}

// ========================================
// Phone GPS
// ========================================

function startPhoneTracking() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "此瀏覽器不支援手機 GPS 定位。"
        );

        return;

    }


    if (
        trackingPhoneWatchId !== null
    ) {

        console.log(
            "[Tracking GPS] 手機 GPS 已經啟動。"
        );

        return;

    }


    trackingPhoneWatchId =
        navigator.geolocation.watchPosition(

            handlePhonePosition,

            handlePhonePositionError,

            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0

            }

        );


    console.log(
        "[Tracking GPS] 手機 GPS 已啟動。"
    );

}


// ========================================
// Phone GPS Position
// ========================================

function handlePhonePosition(position) {

    const location = {

        lat:
            position.coords.latitude,

        lng:
            position.coords.longitude

    };


    let tracked =
        trackingEntities.get(
            "phone-user"
        );


    if (!tracked) {

        tracked = {

            id: "phone-user",

            name: "我的手機",

            type: "PHONE",

            icon: "📱",

            position: location,

            marker:
                createTrackingMarker({
                    id: "phone-user",

                    name: "我的手機",

                    type: "PHONE",

                    icon: "📱",

                    position: location
                })

        };


        trackingEntities.set(
            "phone-user",
            tracked
        );

    } else {

        tracked.position =
            location;


        if (tracked.marker) {

            tracked.marker.position =
                location;

        }

    }


    updateTrackingEntityList();

    updateTrackingStatus();

    recordTrackingLocation({

        lat:
            location.lat,

        lng:
            location.lng,

        accuracy:
            position.coords.accuracy

    }).then(
        () => loadCurrentMissionLocations()
    );

    console.log(
        "[Tracking GPS] 位置更新:",
        location
    );

}


// ========================================
// Phone GPS Error
// ========================================

function handlePhonePositionError(error) {

    console.warn(
        "[Tracking GPS] 定位失敗:",
        error
    );


    if (
        error.code ===
        error.PERMISSION_DENIED
    ) {

        alert(
            "手機 GPS 權限被拒絕，請允許瀏覽器使用定位。"
        );

    }

}


// ========================================
// Stop Phone GPS
// ========================================

function stopPhoneTracking() {

    if (
        trackingPhoneWatchId === null
    ) {

        return;

    }


    navigator.geolocation.clearWatch(
        trackingPhoneWatchId
    );


    trackingPhoneWatchId = null;


    const tracked =
        trackingEntities.get(
            "phone-user"
        );


    if (tracked?.marker) {

        tracked.marker.map = null;

    }


    trackingEntities.delete(
        "phone-user"
    );


    updateTrackingEntityList();

    updateTrackingStatus();


    console.log(
        "[Tracking GPS] 手機 GPS 已停止。"
    );

}


// ========================================
// Tracking Status
// ========================================

function updateTrackingStatus() {

    const status =
        document.getElementById(
            "tracking-status"
        );


    if (!status) {

        return;

    }


    const active =
        trackingSimulationRunning ||
        trackingPhoneWatchId !== null ||
        trackingEntities.size > 0;


    if (active) {

        status.textContent =
            "TRACKING";

        status.classList.add(
            "active"
        );

    } else {

        status.textContent =
            "OFFLINE";

        status.classList.remove(
            "active"
        );

    }

}


// ========================================
// Entity List
// ========================================

function updateTrackingEntityList() {

    const list =
        document.getElementById(
            "tracking-entity-list"
        );


    if (!list) {

        return;

    }


    list.innerHTML = "";


    if (
        trackingEntities.size === 0
    ) {

        list.innerHTML = `

            <div
                style="
                    padding:8px;
                    color:var(--text-tertiary);
                    font-size:11px;
                "
            >
                目前沒有定位目標
            </div>

        `;

        return;

    }


    trackingEntities.forEach(
        entity => {

            const item =
                document.createElement("div");


            item.className =
                "tracking-entity";


            item.innerHTML = `

                <div class="tracking-entity-name">

                    <span>
                        ${entity.icon || "📍"}
                    </span>

                    <span>
                        ${entity.name}
                    </span>

                </div>

                <span
                    class="tracking-entity-type"
                >
                    ${entity.type}
                </span>

            `;


            list.appendChild(
                item
            );

        }
    );

}


// ========================================
// Clear All
// ========================================

function clearAllTracking() {

    stopTrackingSimulation();

    stopPhoneTracking();


    trackingEntities.forEach(
        entity => {

            if (entity.marker) {

                entity.marker.map = null;

            }

        }
    );


    trackingEntities.clear();


    trackingVehicleMarkers.forEach(
        marker => {

            if (marker) {

                marker.map = null;

            }

        }
    );


    trackingVehicleMarkers.clear();


    updateTrackingEntityList();

    updateTrackingStatus();


    console.log(
        "[Tracking] 所有定位已清除。"
    );

}


// ========================================
// Cleanup
// ========================================

function destroyTracking() {

    stopMissionLocationPolling();


    clearAllTracking();

    const panel =
        document.getElementById(
            "tracking-control-panel"
        );


    if (panel) {

        panel.remove();

    }


    const toggle =
        document.getElementById(
            "tracking-toggle-button"
        );


    if (toggle) {

        toggle.remove();

    }


    trackingInitialized = false;


    console.log(
        "[Tracking] Tracking 已清理。"
    );

}

async function trackingApiRequest(
    url,
    options = {}
) {

    const token =
        typeof getAuthToken === "function"
            ? getAuthToken()
            : null;

    const headers = {
        "Content-Type":
            "application/json; charset=utf-8",
        ...(options.headers || {})
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error?.message ||
            "Tracking API request failed"
        );

    }

    return data;

}

async function recordTrackingLocation(
    location
) {

    if (
        !currentMission ||
        currentMission.status !== "RUNNING"
    ) {

        console.warn(
            "[Tracking] 目前沒有正在執行的 Mission。"
        );

        return null;

    }

    if (
        !currentMissionRun ||
        !currentMissionRun.id
    ) {

        console.warn(
            "[Tracking] 找不到目前的 Mission Run。"
        );

        return null;

    }


    try {

        const response =
            await trackingApiRequest(
                `${TRACKING_API_BASE}/locations`,
                {
                    method: "POST",

                    body: JSON.stringify({

                        missionRunId:
                            currentMissionRun.id,

                        latitude:
                            location.lat,

                        longitude:
                            location.lng,

                        accuracy:
                            location.accuracy ??
                            null

                    })

                }
            );


        console.log(
            "[Tracking API] GPS 上傳成功:",
            response.data
        );


        return response.data;

    } catch (error) {

        console.error(
            "[Tracking API] GPS 上傳失敗:",
            error
        );

        return null;

    }

}

async function loadCurrentMissionLocations() {

    if (
        !currentMission ||
        currentMission.status !== "RUNNING"
    ) {

        return;

    }


    try {

        const response =
            await trackingApiRequest(
                `${TRACKING_API_BASE}/missions/${currentMission.id}/current`
            );


        const locations =
            response?.data || [];


        renderCurrentMissionVehicles(
            locations
        );


    } catch (error) {

        console.error(
            "[Tracking API] 取得目前車輛位置失敗:",
            error
        );

    }

}

function startMissionLocationPolling() {

    if (trackingMissionLocationTimer) {

        console.log(
            "[Tracking] 車隊位置輪詢已經啟動。"
        );

        return;

    }


    if (
        !currentMission ||
        currentMission.status !== "RUNNING"
    ) {

        console.warn(
            "[Tracking] 目前沒有 RUNNING Mission，無法啟動車隊位置輪詢。"
        );

        return;

    }


    // 先立即取得一次
    loadCurrentMissionLocations();


    trackingMissionLocationTimer =
        setInterval(
            loadCurrentMissionLocations,
            TRACKING_MISSION_LOCATION_INTERVAL
        );


    console.log(
        "[Tracking] 車隊位置輪詢已啟動，每 5 秒更新一次。"
    );

}

function stopMissionLocationPolling() {

    if (!trackingMissionLocationTimer) {

        return;

    }


    clearInterval(
        trackingMissionLocationTimer
    );


    trackingMissionLocationTimer = null;


    console.log(
        "[Tracking] 車隊位置輪詢已停止。"
    );

}

function renderCurrentMissionVehicles(
    locations
) {

    const activeVehicleIds =
        new Set();


    locations.forEach(
        location => {

            if (!location.vehicle_id) {

                return;

            }


            activeVehicleIds.add(
                location.vehicle_id
            );


            let marker =
                trackingVehicleMarkers.get(
                    location.vehicle_id
                );


            const position = {

                lat:
                    Number(
                        location.latitude
                    ),

                lng:
                    Number(
                        location.longitude
                    )

            };


            if (!marker) {

                marker =
                    createTrackingMarker({

                        id:
                            `vehicle-${location.vehicle_id}`,

                        name:
                            location.vehicle_number ||
                            "任務車輛",

                        type:
                            "VEHICLE",

                        icon:
                            location.is_main_vehicle
                                ? "🚛"
                                : "🚚",

                        position

                    });


                trackingVehicleMarkers.set(
                    location.vehicle_id,
                    marker
                );

            } else {

                marker.position =
                    position;

            }

        }
    );


    trackingVehicleMarkers.forEach(
        (marker, vehicleId) => {

            if (
                !activeVehicleIds.has(
                    vehicleId
                )
            ) {

                marker.map = null;

                trackingVehicleMarkers.delete(
                    vehicleId
                );

            }

        }
    );

}


// ========================================
// Window API
// ========================================

window.initTracking =
    initTracking;

window.startTrackingSimulation =
    startTrackingSimulation;

window.stopTrackingSimulation =
    stopTrackingSimulation;

window.startPhoneTracking =
    startPhoneTracking;

window.stopPhoneTracking =
    stopPhoneTracking;

window.clearAllTracking =
    clearAllTracking;

window.destroyTracking =
    destroyTracking;

