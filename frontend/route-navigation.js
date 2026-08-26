/**
 * 戰略中心 - 路線監視面板系統 (v1.7.0)
 * 檔案 5: route-navigation.js
 *
 * 路線導航：
 * 1. 小客車 → Google Routes API
 * 2. 大貨車 → Backend → Azure Maps Truck Routing
 * 3. 大貨車路線編輯 → 控制點 → Backend → Azure Maps 重新貼道路
 * 4. 路線完成後 → Backend Route API → 查詢沿線 CCTV
 */

// Route Editor 狀態

let routeEditMarkers = [];
let routeEditPath = [];
let originalTruckProfile = null;

// Route Editor 原始路線

// 第一次完成路線規劃後保存。
// 後續編輯不可以覆蓋這份資料。
let originalRoutePath = [];

let currentRoutePath = [];

// 主要路線規劃

async function calculateAndDisplayRoute() {

    const start = document.getElementById("startInput").value;

    const end = document.getElementById("endInput").value;

    const selectedVehicleType = document.getElementById("vehicle-type")?.value || "car";

    document.getElementById("clearRouteBtn").style.display = "inline-block";

    if (!start || !end) {

        window.alert("請輸入起始地與目的地！");
        return;

    }

    // 清除舊路線

    clearCurrentRoute();

    let decodedPath = null;

    try {

        // 大貨車

        if (selectedVehicleType === "truck") {

            const truckProfile = {
                height: parseFloat(document.getElementById("truck-height")?.value) || 4.0,
                width: parseFloat(document.getElementById("truck-width")?.value) || 2.5,
                weightKg: (parseFloat(document.getElementById("truck-weight")?.value) || 20) * 1000,
                loadType: document.getElementById("truck-load-type")?.value || ""
            };

            // 保存這次任務使用的車輛規格

            originalTruckProfile = { ...truckProfile };
            decodedPath = await calculateTruckRoute(start, end, truckProfile);

        }

        // 小客車

        else {

            decodedPath = await calculateCarRoute(start, end);

        }

    }

    catch (error) {

        console.error("[路線規劃失敗]", error);

        window.alert("路線規劃失敗，請確認地址正確，且相關 API 已啟用。");

        return;

    }

    if (!decodedPath || decodedPath.length === 0) {

        window.alert("未找到有效路線");
        return;

    }

    // 畫出完整道路路線

    drawRoutePolyline(decodedPath);

    // 顯示路線編輯按鈕

    showRouteEditButtons();

    const resetButton =
        document.getElementById("resetRouteBtn");

    if (resetButton) {
        resetButton.style.display = "inline-block";
    }

    // 查詢沿線 CCTV

    try {

        const result = await fetchRouteCameras(decodedPath);

        console.log("[Route CCTV]", result);

        renderRouteMarkers(result.cameras);

    }

    catch (error) {

        console.error("[Route CCTV Error]", error);

    }

    // 大貨車才建立控制點

    if (selectedVehicleType === "truck") {

        // 保存原始路線
        originalRoutePath = decodedPath.map(point => new google.maps.LatLng(point.lat(), point.lng()));

        // 保存目前路線
        currentRoutePath = originalRoutePath.map(point => new google.maps.LatLng(point.lat(), point.lng()));

        // 控制點基準
        routeEditPath = simplifyRoutePath(
            currentRoutePath,
            20
        );

    }

}

// 路線編輯按鈕 UI

function showRouteEditButtons() {

    const editButton =
        document.getElementById("editRouteBtn");

    if (editButton) {
        editButton.style.display = "inline-block";
    }

}


function hideRouteEditButtons() {

    const editButton =
        document.getElementById("editRouteBtn");

    if (editButton) {
        editButton.style.display = "none";
    }

}

// 小客車路線
// Google Routes API

async function calculateCarRoute(start, end) {

    console.log("[系統] 正在呼叫 Google Routes API...");


    const { Route } = await google.maps.importLibrary("routes");

    const response = await Route.computeRoutes({

        origin: start,
        destination: end,
        travelMode: "DRIVING",
        routingPreference: "TRAFFIC_AWARE",
        fields: [
            "path",
            "viewport"
        ]

    });


    const route = response?.routes?.[0];

    if (!route) {

        return null;

    }

    // 自動縮放地圖

    if (route.viewport) {

        map.fitBounds(route.viewport);

    }

    else if (route.path?.length) {

        const bounds = new google.maps.LatLngBounds();

        route.path.forEach(latLng => bounds.extend(latLng));

        map.fitBounds(bounds);

    }

    return route.path;

}

// 大貨車路線
// Backend → Azure Maps

async function calculateTruckRoute(start, end, truckProfile) {

    console.log("[Truck Route] 正在取得地址座標...");

    const originCoord = await geocodeAddress(start);

    const destCoord = await geocodeAddress(end);

    console.log("[Truck Route] Origin:", originCoord);

    console.log("[Truck Route] Destination:", destCoord);

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/routes/truck`, {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            origin: {
                lat: originCoord.lat,
                lng: originCoord.lng
            },
            destination: {
                lat: destCoord.lat,
                lng: destCoord.lng
            },
            height: truckProfile.height,
            width: truckProfile.width,
            weightKg: truckProfile.weightKg,
            loadType: truckProfile.loadType

        })

    }
    );

    const data = await response.json();

    if (!response.ok) {

        console.error("[Truck Route API Error]", data);

        throw new Error(data.message || "Truck route API request failed");

    }

    if (!data.success || !data.path || data.path.length === 0) {

        return null;

    }

    // Backend 回傳：
    // [ { lat, lng }, { lat, lng } ]
    // 轉成 Google Maps LatLng

    const path = data.path.map(point => new google.maps.LatLng(
        point.lat, point.lng
    )
    );


    fitMapToPath(path);

    console.log(`[Truck Route] ${path.length} 個道路點`);

    return path;

}

// 地址 → 座標
// 使用 Google Geocoder

function geocodeAddress(address) {

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {

        geocoder.geocode(
            { address },
            (results, status) => {
                if (status === "OK" && results?.[0]) {

                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()

                    });

                }

                else {

                    reject(new Error(`Geocoding failed: ${status}`));

                }

            }
        );

    }
    );

}

// 繪製路線
// 注意：
// 不再使用 Polyline editable / draggable
// 因為 Google Polyline 的拖曳只是在前端
// 移動線段，不會重新貼道路。
// 現在改成：
// 控制點 → Backend → Azure Maps

function drawRoutePolyline(path) {

    clearRouteEditMarkers();

    if (currentRoutePolyline) {

        currentRoutePolyline.setMap(null);

        currentRoutePolyline = null;

    }

    currentRoutePolyline = new google.maps.Polyline({

        path,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.85,
        strokeWeight: 6,
        editable: false,
        draggable: false,
        map

    });

    // 保存目前道路

    routeEditPath = simplifyRoutePath(path, 20);

    console.log(`[Route] 道路點：${path.length}`);

}

// 路線簡化
// Azure Maps 回傳可能有很多點。
// 不需要每個道路點都做成控制點。
// 控制點仍然位於原本道路上。=

function simplifyRoutePath(path, maxPoints = 20) {

    if (!path || path.length <= maxPoints) {

        return [...path];

    }

    const result = [];

    const step = (path.length - 1) / (maxPoints - 1);

    for (let i = 0; i < maxPoints; i++) {

        const index = Math.round(i * step);

        result.push(path[index]);

    }

    return result;

}

// 建立 Route Editor 控制點
// 注意：
// 不使用 CCTV 的 Marker 圖示。
// 使用 HTML 自訂圓點：
// 讓使用者可以清楚知道：
// 這是「路線控制點」
// 不是監視器。

function createRouteEditMarkers() {

    clearRouteEditMarkers();

    if (!currentRoutePolyline || !routeEditPath || routeEditPath.length < 3) {

        return;

    }

    // 只建立中間控制點
    // 起點 / 終點不讓使用者拖曳

    for (let i = 1; i < routeEditPath.length - 1; i++) {

        const markerElement = document.createElement("div");

        markerElement.className = "route-control-marker";

        markerElement.innerHTML = `            <div class="route-control-dot"></div>            `;

        const marker = new google.maps.marker.AdvancedMarkerElement({

            map,
            position: routeEditPath[i],
            content: markerElement,
            gmpDraggable: true,
            title: `路線控制點 ${i}`

        });

        marker.routeIndex = i;

        // 拖曳中

        marker.addListener("drag", () => {

            updateRouteEditPoint(marker);

        }
        );

        // 拖曳完成

        marker.addListener("dragend", async () => {

            await onRouteEditFinished(marker);

        }
        );

        routeEditMarkers.push(marker);

    }

    console.log(`[Route Editor] 建立 ${routeEditMarkers.length} 個控制點`);

}

// 更新控制點位置

function updateRouteEditPoint(marker) {

    const index = marker.routeIndex;

    if (marker.position) {

        routeEditPath[index] = new google.maps.LatLng(
            marker.position.lat,
            marker.position.lng
        );

    }

}

// 控制點拖曳完成
// 重點：
// 不直接把線拉過去。
// 而是：
// 控制點
// ↓
// POST /api/routes/truck/edit
// ↓
// Azure Maps
// ↓
// 每段重新貼道路
// ↓
// 回傳新的完整道路

async function onRouteEditFinished(marker) {

    if (!originalTruckProfile) {

        console.warn("[Route Editor] 找不到車輛規格");

        return;

    }


    console.log("[Route Editor] 控制點移動完成，重新計算道路...");

    // 取得目前所有控制點

    const controlPoints = routeEditPath.map(point => ({

        lat: typeof point.lat === "function" ? point.lat() : point.lat,
        lng: typeof point.lng === "function" ? point.lng() : point.lng

    })
    );
    const previousPath = currentRoutePath.map(point => ({

        lat: typeof point.lat === "function" ? point.lat() : point.lat,
        lng: typeof point.lng === "function" ? point.lng() : point.lng

    })
    );
    const editedIndex = marker.routeIndex;

    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/routes/truck/edit`, {

            method: "POST",
            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                controlPoints,
                previousPath,
                editedIndex,
                height: originalTruckProfile.height,
                width: originalTruckProfile.width,
                weightKg: originalTruckProfile.weightKg,
                loadType: originalTruckProfile.loadType

            })

        }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error("[Edited Truck Route API Error]", data);

            throw new Error(data.message || "Edited truck route failed");

        }

        if (!data.success || !data.path || data.path.length === 0) {

            throw new Error("No edited truck route returned");

        }

        // Azure Maps 新道路

        const newPath = data.path.map(point => new google.maps.LatLng(point.lat, point.lng));

        currentRoutePath = newPath.map(point => new google.maps.LatLng(point.lat(), point.lng()));

        currentRoutePolyline.setPath(newPath);

        console.log(`[Route Editor] 新道路 ${newPath.length} 個點`);

        // 注意：不要用 newPath 覆蓋原始控制點基準。
        // routeEditPath 保留目前的編輯控制點。

        // 重建控制點

        createRouteEditMarkers();

        // 重新查詢沿線 CCTV

        const result = await fetchRouteCameras(newPath);

        renderRouteMarkers(result.cameras);

        console.log("[Route Editor] 道路重新計算完成");

    }

    catch (error) {

        console.error("[Route Editor]", error);

        window.alert("路線重新計算失敗，請確認控制點位置及 Azure Maps API 狀態。");

    }

}

// 開啟 / 關閉路線編輯

function setRouteEditMode(enabled) {

    isRouteEditable = enabled;

    if (!enabled) {

        clearRouteEditMarkers();

        return;

    }


    if (!currentRoutePolyline) {

        return;

    }

    // 沒有車輛資料
    // 代表不是大貨車

    if (!originalTruckProfile) {

        console.warn("[Route Editor] 目前沒有 Truck Profile");

        return;

    }

    createRouteEditMarkers();

}


// 清除控制點

function clearRouteEditMarkers() {

    routeEditMarkers.forEach(marker => {

        marker.map = null;

    }
    );

    routeEditMarkers = [];

}

// 清除目前路線

function clearCurrentRoute() {

    clearRouteEditMarkers();


    if (currentRoutePolyline) {

        currentRoutePolyline.setMap(null);

        currentRoutePolyline = null;

    }

    routeEditPath = [];

    originalRoutePath = [];

}

// 將地圖縮放到整條路線

function fitMapToPath(path) {

    if (!path || path.length === 0) {

        return;

    }


    const bounds = new google.maps.LatLngBounds();


    path.forEach(point => bounds.extend(point));


    map.fitBounds(bounds);

}

// 重置地圖

// Route Editor：重設為原始路線

// Route Editor：重設為原始路線

async function resetRouteToOriginal() {

    if (!originalRoutePath || originalRoutePath.length === 0) {

        console.warn("[Route Editor] 沒有可重設的原始路線");
        return;

    }

    console.log("[Route Editor] 重設為原始路線");

    try {

        // 1. 離開目前編輯模式
        isRouteEditable = false;

        // 2. 清除目前控制點
        clearRouteEditMarkers();

        // 3. 複製原始路線成目前路線
        currentRoutePath = originalRoutePath.map(point => new google.maps.LatLng(point.lat(), point.lng()));

        // 4. 恢復 Polyline
        if (currentRoutePolyline) {

            currentRoutePolyline.setPath(currentRoutePath);

        }
        else {

            drawRoutePolyline(currentRoutePath);

        }

        // 5. 重建控制點基準
        routeEditPath = simplifyRoutePath(currentRoutePath, 20);

        // 6. 更新 CCTV
        console.log("[Route Editor] 重新查詢原始路線 CCTV...");

        const result = await fetchRouteCameras(currentRoutePath);

        if (result && Array.isArray(result.cameras)) {

            renderRouteMarkers(result.cameras);

            console.log(`[Route Editor] 原始路線 CCTV：${result.cameras.length} 支`);

        }

        // 7. UI 狀態

        const editButton = document.getElementById("editRouteBtn");

        if (editButton) { editButton.style.display = "inline-block"; }

        console.log("[Route Editor] 已恢復原始路線");

    }
    catch (error) {

        console.error("[Route Editor] 重設原始路線失敗", error);

        window.alert("重設路線失敗，請查看瀏覽器主控台。");

    }
}

async function resetMapToAllCameras() {

    console.log("取消導航");

    isRouteMode = false;

    originalTruckProfile = null;

    clearCurrentRoute();

    // 移除目前路線 CCTV

    activeCamMarkers.forEach(marker => { marker.map = null; });

    activeCamMarkers = [];

    if (markerCluster) {

        markerCluster.clearMarkers();

    }

    // 重新抓取目前畫面的 CCTV

    await fetchCameraData();

    document.getElementById("clearRouteBtn").style.display = "none";

    hideRouteEditButtons();

}

// 路線編輯按鈕

document.getElementById("editRouteBtn")?.addEventListener("click", () => {

    if (!currentRoutePolyline) {

        return;

    }

    isRouteEditable = !isRouteEditable;

    setRouteEditMode(isRouteEditable);

    console.log(isRouteEditable ? "[Route Editor] 開啟路線編輯" : "[Route Editor] 關閉路線編輯");

}
);

function hideRouteEditorButtons() {

    const editButton = document.getElementById("editRouteBtn");

    if (editButton) {

        editButton.style.display = "none";

    }


    if (confirmButton) {

        confirmButton.style.display = "none";

    }

}

// 暴露給 map-core.js

window.calculateAndDisplayRoute = calculateAndDisplayRoute;
window.resetMapToAllCameras = resetMapToAllCameras;
window.resetRouteToOriginal = resetRouteToOriginal;