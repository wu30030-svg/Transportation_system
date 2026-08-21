/**
 * 戰略中心 - 路線監視面板系統 (v1.7.0)
 * 檔案 5: route-navigation.js - 🗺️ Routes 導航（Car / Truck 雙軌）與沿線幾何篩選
 */
// 🔑 Azure Maps 金鑰
// ⚠️ 正式上線前務必改走後端代理，不要讓金鑰留在前端檔案裡（參考上方說明）
const AZURE_MAPS_KEY = window.AZURE_MAPS_KEY || "";

async function calculateAndDisplayRoute() {
    const start = document.getElementById("startInput").value;
    const end = document.getElementById("endInput").value;
    const selectedVehicleType = document.getElementById("vehicle-type")?.value || 'car';
    document.getElementById("clearRouteBtn").style.display = "inline-block";

    if (!start || !end) {
        window.alert("請輸入起始地與目的地！");
        return;
    }

    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
        currentRoutePolyline = null;
    }

    let decodedPath = null;

    try {
        if (selectedVehicleType === 'truck') {
            const truckProfile = {
                height: parseFloat(document.getElementById('truck-height')?.value) || 4.0,
                width: parseFloat(document.getElementById('truck-width')?.value) || 2.5,
                weightKg: (parseFloat(document.getElementById('truck-weight')?.value) || 20) * 1000, // 公噸 → 公斤
                loadType: document.getElementById('truck-load-type')?.value || ''
            };
            decodedPath = await calculateTruckRoute(start, end, truckProfile);
        } else {
            decodedPath = await calculateCarRoute(start, end);
        }
    } catch (error) {
        console.error("路線規劃失敗:", error);
        window.alert("路線規劃失敗，請確認地址正確、且相關 API 已啟用。");
        return;
    }

    if (!decodedPath || decodedPath.length === 0) {
        window.alert("未找到有效路線");
        return;
    }

    drawRoutePolyline(decodedPath, true); // true = 可拖曳編輯
    const result = await fetchRouteCameras(decodedPath);

    console.log(result);

    renderRouteMarkers(result.cameras);
}

/**
 * 小客車路線 (2026 Routes API)
 */
async function calculateCarRoute(start, end) {
    console.log("[系統] 正在呼叫 2026 全新 Routes API...");
    const { Route } = await google.maps.importLibrary("routes");
    const response = await Route.computeRoutes({
        origin: start,
        destination: end,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        fields: ['path', 'viewport']
    });

    const route = response?.routes?.[0];
    if (!route) return null;

    if (route.viewport) {
        map.fitBounds(route.viewport);
    } else if (route.path?.length) {
        const bounds = new google.maps.LatLngBounds();
        route.path.forEach(latLng => bounds.extend(latLng));
        map.fitBounds(bounds);
    }

    return route.path;
}

/**
 * 大貨車路線 (Azure Maps Truck Routing)
 */
async function calculateTruckRoute(start, end, truckProfile) {
    const originCoord = await geocodeAddress(start);
    const destCoord = await geocodeAddress(end);

    let url = `https://atlas.microsoft.com/route/directions/json?api-version=1.0`
        + `&subscription-key=${AZURE_MAPS_KEY}`
        + `&query=${originCoord.lat},${originCoord.lng}:${destCoord.lat},${destCoord.lng}`
        + `&travelMode=truck`
        + `&vehicleHeight=${truckProfile.height}`
        + `&vehicleWidth=${truckProfile.width}`
        + `&vehicleWeight=${truckProfile.weightKg}`;

    if (truckProfile.loadType) {
        url += `&vehicleLoadType=${truckProfile.loadType}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return null;

    const points = data.routes[0].legs.flatMap(leg => leg.points);
    const path = points.map(p => new google.maps.LatLng(p.latitude, p.longitude));

    const bounds = new google.maps.LatLngBounds();
    path.forEach(latLng => bounds.extend(latLng));
    map.fitBounds(bounds);

    return path;
}

/**
 * 地址轉座標 (沿用 Google Geocoder)
 */
function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK") {
                resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                });
            } else {
                reject(status);
            }
        });
    });
}

/**
 * 繪製導航折線 (可選是否開放拖曳編輯)
 */
function drawRoutePolyline(path, editable = false) {

    currentRoutePolyline = new google.maps.Polyline({

        path,

        geodesic: true,

        strokeColor: "#4285F4",

        strokeOpacity: 0.8,

        strokeWeight: 6,

        editable,

        draggable: editable,

        map

    });

    const mvcPath = currentRoutePolyline.getPath();

    mvcPath.addListener("set_at", onRouteEdited);

    mvcPath.addListener("insert_at", onRouteEdited);

}

async function onRouteEdited(){

    const newPath = currentRoutePolyline.getPath().getArray();

    const result = await fetchRouteCameras(newPath);

    renderRouteMarkers(result.cameras);

}

async function resetMapToAllCameras() {

    console.log("取消導航");

    isRouteMode = false;

    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
        currentRoutePolyline = null;
    }

    // 把導航模式建立的 Marker 全部移除
    activeCamMarkers.forEach(marker => {
        marker.map = null;
    });

    activeCamMarkers = [];

    if (markerCluster) {
        markerCluster.clearMarkers();
    }

    // 重新抓目前畫面的 CCTV
    await fetchCameraData();

    // 隱藏按鈕
    document.getElementById("clearRouteBtn").style.display = "none";
}

/**
 * 路線編輯按鈕（HTML 若還沒加入這兩顆按鈕，這裡會安全跳過，不會報錯）
 */

document.getElementById("editRouteBtn")?.addEventListener("click", () => {
    isRouteEditable = !isRouteEditable;
    currentRoutePolyline?.setEditable(isRouteEditable);
    currentRoutePolyline?.setDraggable(isRouteEditable);
});

document.getElementById("confirmRouteBtn")?.addEventListener("click", async () => {

    if (!currentRoutePolyline) return;

    const finalPath = currentRoutePolyline
        .getPath()
        .getArray();

    const result = await fetchRouteCameras(finalPath);

    renderRouteMarkers(result.cameras);

    currentRoutePolyline.setEditable(false);

});

// 綁定全域
window.calculateAndDisplayRoute = calculateAndDisplayRoute;
window.resetMapToAllCameras = resetMapToAllCameras;