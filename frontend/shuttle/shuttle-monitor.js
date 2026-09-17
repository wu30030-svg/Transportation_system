console.log("[Shuttle Monitor] A 路線監控端啟動");

// ========================================
// Configuration
// ========================================

const SHUTTLE_LOCATION_API =
    `${CONFIG.API_BASE_URL}/api/tracking/shuttle/current`;

const SHUTTLE_REFRESH_INTERVAL = 5000;

// ========================================
// State
// ========================================

let shuttleMap = null;

const shuttleMarkers = new Map();

let shuttleRefreshTimer = null;

// ========================================
// Map Initialization
// ========================================

async function initShuttleMap() {


    if (shuttleMap) {
        return;
    }

    if (!window.google || !google.maps) {
        console.error(
            "[Shuttle Monitor] Google Maps 尚未載入"
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
        "[Shuttle Monitor] Google Maps 初始化完成"
    );

    await refreshShuttleLocations();

    shuttleRefreshTimer =
        setInterval(
            refreshShuttleLocations,
            SHUTTLE_REFRESH_INTERVAL
        );


}

// ========================================
// Fetch Shuttle Locations
// ========================================

async function refreshShuttleLocations() {


    const token = getAuthToken();

    if (!token) {

        console.error(
            "[Shuttle Monitor] 沒有登入 Token"
        );

        return;
    }


    try {

        const response = await fetch(
            SHUTTLE_LOCATION_API,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (response.status === 401) {

            console.warn(
                "[Shuttle Monitor] Token 已失效"
            );

            if (
                typeof handleUnauthorized ===
                "function"
            ) {

                handleUnauthorized();

            }

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "無法取得接駁車位置"
            );
        }


        const locations =
            Array.isArray(data.data)
                ? data.data
                : [];


        console.log(
            `[Shuttle Monitor] 收到 ${locations.length} 筆定位資料`
        );


        renderARouteLocations(locations);

    } catch (error) {

        console.error(
            "[Shuttle Monitor] 取得定位失敗:",
            error
        );
    }

}

// ========================================
// Render A Route
// ========================================

function renderARouteLocations(locations) {

    const currentIds = new Set();

    locations.forEach(location => {

        const personnelNumber =
            location.personnel_number;

        if (
            typeof personnelNumber !== "string"
        ) {
            return;
        }

        if (
            typeof location.latitude !== "number" ||
            typeof location.longitude !== "number"
        ) {
            return;
        }

        currentIds.add(
            personnelNumber
        );

        updateShuttleMarker(
            personnelNumber,
            location.latitude,
            location.longitude
        );

    });

    /*
     * 移除這次 API 沒有回傳的車輛 Marker。
     *
     * 目前不判斷「在線 / 離線」，
     * 只是讓地圖保持與目前資料一致。
     */

    shuttleMarkers.forEach(
        (marker, personnelNumber) => {

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

function updateShuttleMarker(
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
            createShuttleMarker(
                personnelNumber,
                position
            );

        shuttleMarkers.set(
            personnelNumber,
            marker
        );

        return;
    }


    marker.position = position;


}

// ========================================
// Create Shuttle Marker
// ========================================

function createShuttleMarker(
    personnelNumber,
    position
) {


    const markerElement =
        document.createElement("div");

    markerElement.className =
        "shuttle-marker";


    const dot =
        document.createElement("span");

    dot.className =
        "shuttle-dot";


    const label =
        document.createElement("span");

    label.className =
        "shuttle-label";


    /*
     * 直接使用 Backend 回傳的車輛識別編號
     */

    const vehicleNumber =
        personnelNumber;

    label.textContent =
        vehicleNumber;


    markerElement.appendChild(dot);
    markerElement.appendChild(label);


    const marker =
        new google.maps.marker.AdvancedMarkerElement({
            map: shuttleMap,
            position,
            content: markerElement,
            title: vehicleNumber
        });


    return marker;


}

// ========================================
// Start
// ========================================

function waitForGoogleMaps() {


    if (
        window.google &&
        google.maps &&
        google.maps.importLibrary
    ) {

        initShuttleMap();

        return;
    }


    setTimeout(
        waitForGoogleMaps,
        100
    );


}

waitForGoogleMaps();

// ========================================
// Cleanup
// ========================================

window.addEventListener(
    "beforeunload",
    () => {


        if (shuttleRefreshTimer) {

            clearInterval(
                shuttleRefreshTimer
            );

            shuttleRefreshTimer = null;
        }

    }


);
// ========================================
// Logout
// ========================================

const logoutButton =
    document.getElementById("logout-btn");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            if (shuttleRefreshTimer) {

                clearInterval(
                    shuttleRefreshTimer
                );

                shuttleRefreshTimer = null;

            }

            await logout();

            window.location.href =
                "../index.html";

        }
    );

}