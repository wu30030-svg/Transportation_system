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
    filterAndShowRouteCameras(decodedPath);
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
        path: path,
        geodesic: true,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 6,
        editable: editable,
        draggable: editable,
        map: map
    });

    const path_ = currentRoutePolyline.getPath();
    google.maps.event.addListener(path_, 'set_at', onRouteEdited);
    google.maps.event.addListener(path_, 'insert_at', onRouteEdited);
}

function onRouteEdited() {
    const newPath = currentRoutePolyline.getPath().getArray();
    filterAndShowRouteCameras(newPath);
}

/**
 * 根據導航路線篩選並顯示周圍的監視器
 */
function filterAndShowRouteCameras(path) {
    if (!path || path.length === 0) {
        console.warn("[導航篩選] 傳入的軌跡路徑為空，無法進行篩選。");
        return;
    }

    const normalizedPath = path.map(pt => {
        const lat = typeof pt.lat === 'function' ? pt.lat() : (pt.lat ?? pt.latitude);
        const lng = typeof pt.lng === 'function' ? pt.lng() : (pt.lng ?? pt.longitude);
        return { lat: Number(lat), lng: Number(lng) };
    }).filter(pt => !isNaN(pt.lat) && !isNaN(pt.lng));

  
    if (normalizedPath.length === 0) {
        console.error("[導航篩選] Path 座標解析失敗，無有效點位。");
        return;
    }

  // 2. 計算 AABB 外接矩形 Bounding Box (加上安全 margin 緩衝)
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  normalizedPath.forEach(pt => {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lng > maxLng) maxLng = pt.lng;
  });

    const padding = 0.015;
    const bounds = {
        minLat: minLat - padding,
        maxLat: maxLat + padding,
        minLng: minLng - padding,
        maxLng: maxLng + padding
    };

    const routePolyline = new google.maps.Polyline({
        path: normalizedPath,
        visible: false
    });
    const toleranceOffset = 0.0005;
    let matchedCams = [];

    allCams.forEach(cam => {
        const camLat = parseFloat(cam.cam_lat || cam.lat);
        const camLng = parseFloat(cam.cam_lng || cam.lng || cam.lon);
        if (isNaN(camLat) || isNaN(camLng)) return;

        if (camLat < bounds.minLat || camLat > bounds.maxLat || 
            camLng < bounds.minLng || camLng > bounds.maxLng) {
            return;
        }
        // 第二層：Google Geometry 精確路徑距離比對
        const camLatLng = new google.maps.LatLng(camLat, camLng);
            if (google.maps.geometry?.poly?.isLocationOnEdge(camLatLng, routePolyline, toleranceOffset)) {
            matchedCams.push(cam);
        }
    });

    console.log(`[導航篩選] 全台 ${allCams.length} 支 CCTV 中，符合路線周邊的有 ${matchedCams.length} 支。`);
    if (typeof renderRouteMarkers === 'function') {
        renderRouteMarkers(matchedCams);
    } else if (window.cctvRenderer && typeof window.cctvRenderer.renderRouteMarkers === 'function') {
        window.cctvRenderer.renderRouteMarkers(matchedCams);
    }
}

function resetMapToAllCameras() {
    isRouteMode = false;
    routeCamIds.clear();

    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
        currentRoutePolyline = null;
    }

    activeCamMarkers.forEach(marker => { marker.map = null; });
    activeCamMarkers = [];
    visibleMarkerIds.clear();

    if (markerCluster) markerCluster.clearMarkers();

    updateMarkersInViewport();
}

/**
 * 路線編輯按鈕（HTML 若還沒加入這兩顆按鈕，這裡會安全跳過，不會報錯）
 */

document.getElementById("editRouteBtn")?.addEventListener("click", () => {
    isRouteEditable = !isRouteEditable;
    currentRoutePolyline?.setEditable(isRouteEditable);
    currentRoutePolyline?.setDraggable(isRouteEditable);
});

document.getElementById("confirmRouteBtn")?.addEventListener("click", () => {
    if (!currentRoutePolyline) return;
    const finalPath = currentRoutePolyline.getPath().getArray();
    filterAndShowRouteCameras(finalPath);
    currentRoutePolyline.setEditable(false);
});

// 綁定全域
window.calculateAndDisplayRoute = calculateAndDisplayRoute;
window.filterAndShowRouteCameras = filterAndShowRouteCameras;
window.resetMapToAllCameras = resetMapToAllCameras;