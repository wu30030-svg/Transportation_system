/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 6: cctv-renderer.js - 👁️ CCTV 渲染與彈出視窗管理
 */

/**
 * 撈取監視器 CCTV JSON
 */
async function fetchCameraData() {
    try {
        const bounds = map.getBounds();

        if (!bounds)return;
        
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const url =
            `http://localhost:3000/api/cameras/viewport` +
            `?minLat=${sw.lat()}` +
            `&maxLat=${ne.lat()}` +
            `&minLon=${sw.lng()}` +
            `&maxLon=${ne.lng()}`;

        console.log(url);

        const response = await fetch(url);

        allCams = await response.json();

        console.log("目前載入 CCTV：", allCams.length);
        

        updateMarkersInViewport();

    }
    catch(err){

        console.error(err);

    }

}

/**
 * v1.6.1 智慧動態可視範圍渲染 (Viewport 裁剪，地圖上永遠只維持數百個 Active DOM)
 */
function updateMarkersInViewport() {
    if (!map || isRouteMode) return;

    const bounds = map.getBounds();
    // 🛡️ 啟動防禦：地圖尚未準備好時，200ms 後重試，確保一定成功載入
    if (!bounds) {
        console.warn("[效能防禦] 地圖邊界未就緒，將於 200ms 後重新嘗試...");
        setTimeout(updateMarkersInViewport, 200);
        return;
    }

    const currentVisibleIds = new Set();
    const markersToAddToCluster = [];

    allCams.forEach(cam => {
    const lat = Number(cam.latitude);
    const lng = Number(cam.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const latLng = new google.maps.LatLng(lat, lng);

    if (bounds.contains(latLng)) {

        const camId = cam.camera_id;

        currentVisibleIds.add(camId);

        let marker = markerCache.get(camId);

        if (!marker) {

            marker = new google.maps.marker.AdvancedMarkerElement({

                position: latLng,

                map,

                title: cam.camera_name,

                gmpClickable: true

            });

            marker.addEventListener("gmp-click", () => {

                openMonitorInfoWindow(marker, cam);

            });

            markerCache.set(camId, marker);

        } else {

            marker.map = map;

        }

        visibleMarkerIds.add(camId);

        markersToAddToCluster.push(marker);

    }

});

    // 處理離開可視範圍的標記 (卸載 map 釋放 DOM，保留實例於快取)
    for (let camId of visibleMarkerIds) {
        if (!currentVisibleIds.has(camId)) {
            const marker = markerCache.get(camId);
            if (marker) {
                marker.map = null;
            }
            visibleMarkerIds.delete(camId);
        }
    }

    activeCamMarkers = markersToAddToCluster;

    // 重新同步叢集
    if (markerCluster) {
        markerCluster.clearMarkers();
        markerCluster.addMarkers(activeCamMarkers);
    }
}

/**
 * 開啟路況彈出視窗 (InfoWindow) 與拖曳封裝
 */
function openMonitorInfoWindow(marker, cam) {
    // 【v1.2 記憶體防禦】開新泡泡前必先清理舊計時器
    if (infoWindowInterval) clearInterval(infoWindowInterval);
    if (currentInfoWindow) currentInfoWindow.close();

    const nextChLabel = (typeof manualSlotIndex !== 'undefined' ? manualSlotIndex : 0) + 1;

    currentInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="color:#000; font-family:sans-serif; width:220px;">
                <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:bold; color:#111;">${cam.camera_name}</h4>
                <div style="font-size:11px; color:#007bff; font-weight:bold; margin-bottom:6px; display:flex; align-items:center; gap:2px;">
                    <span>⚡ 支援影像「滑鼠拖曳」派件</span>
                </div>
                <div id="dragCamArea"
                     draggable="true"
                     style="background:#000; aspect-ratio:16/9; display:flex; justify-content:center; align-items:center; overflow:hidden; border-radius:4px; cursor:grab; border:2px dashed #007bff;"
                     title="滑鼠按住此處拖曳至下方電視牆">
                    <img id="info-window-img" 
                         src="${getCacheBusterUrl(cam.camera_url)}" 
                         style="width:100%; height:100%; object-fit:cover; pointer-events: none;" 
                         onerror="this.src='https://placehold.co/640x360/000000/444444?text=NO+SIGNAL'">
                </div>
                <button id="addCamBtn"
                        style="margin-top:8px; width:100%; padding:6px; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">
                        點擊按鈕派件 (CH${nextChLabel})
                </button>
            </div>
        `
    });

    currentInfoWindow.open(map, marker);

    google.maps.event.addListenerOnce(currentInfoWindow, "domready", () => {
        const btn = document.getElementById("addCamBtn");
        if (btn) {
            btn.addEventListener("click", () => {
                window.addCamToWallManually(cam);
            });
        }

        const dragArea = document.getElementById("dragCamArea");
        if (dragArea) {
            dragArea.addEventListener("dragstart", (event) => {
                handleDragStart(event, cam);
            });
        }
    });

    // InfoWindow 內即時影像 3 秒重新整理
    infoWindowInterval = setInterval(() => {
        const img = document.getElementById("info-window-img");
        if (img) {
            img.src = getCacheBusterUrl(cam.camera_url);
        }
    }, 3000);

    // 關閉 InfoWindow 事件防禦性清理
    google.maps.event.addListener(currentInfoWindow, "closeclick", () => {
        if (infoWindowInterval) {
            clearInterval(infoWindowInterval);
            infoWindowInterval = null;
            console.log(`[安全性清理] 已關閉 ${cam.camera_name} 視窗計時器。`);
        }
    });
}
/**
 * 🗺️ 路線模式專用：清空所有舊標記，僅顯示符合路線周邊的 CCTV
 * @param {Array} matchedCams - 經過 AABB 與幾何篩選出的路線沿線監視器陣列
 */
function renderRouteMarkers(matchedCams) {
    document.getElementById("clearRouteBtn").style.display = "inline-block";
    console.log(`[導航渲染] 啟動路線模式，將隱藏無關監視器，僅保留沿線 ${matchedCams.length} 支 CCTV...`);

    // 1. 強制切換為路線模式
    isRouteMode = true;

    // 2. 徹底清空叢集與地圖上所有既有的 Marker
    if (markerCluster) {
        markerCluster.clearMarkers();
    }
    activeCamMarkers.forEach(marker => {
        marker.map = null; // 從地圖移除物理 DOM 節點
    });
    activeCamMarkers = []; // 清空可視陣列

    // 3. 僅為符合路線的監視器建立標記
    matchedCams.forEach(cam => {

        const lat = Number(cam.latitude);
        const lng = Number(cam.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        let marker = markerCache.get(cam.camera_id);

        if (!marker) {

            marker = new google.maps.marker.AdvancedMarkerElement({

                position: { lat, lng },

                map,    

                title: cam.camera_name,

                gmpClickable: true

            });

            marker.addEventListener("gmp-click", () => {

                openMonitorInfoWindow(marker, cam);

            });

            markerCache.set(cam.camera_id, marker);

        } else {

            marker.map = map;

        }


        activeCamMarkers.push(marker);

    });

    // 4. 將路線沿線標記重新加入叢集與地圖
    if (markerCluster) {
        markerCluster.addMarkers(activeCamMarkers);
    }

    console.log(`[導航渲染] 隱藏完成！目前地圖僅顯示路線周邊監視器。`);
}

/**
 * 🔄 取消導航 / 重置地圖：恢復全圖視域動態渲染
 */
function resetMapToAllCameras() {
  console.log("[導航渲染] 取消導航模式，恢復一般視域動態渲染...");
  isRouteMode = false;

  // 移除導航折線
  if (currentRoutePolyline) {
    currentRoutePolyline.setMap(null);
    currentRoutePolyline = null;
  }

  // 重新觸發動態 Viewport 渲染，恢復當前畫面內所有 CCTV
  updateMarkersInViewport();
}

// 綁定全域
window.fetchCameraData = fetchCameraData;
window.updateMarkersInViewport = updateMarkersInViewport;
window.openMonitorInfoWindow = openMonitorInfoWindow;
window.renderRouteMarkers = renderRouteMarkers;