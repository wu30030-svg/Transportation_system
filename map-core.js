/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 7: map-core.js - 🏗️ 核心地圖初始化與 WebGL 記憶體淨化
 */
/**
 * 地圖初始化 entry point
 */
async function initMap() {
    await google.maps.importLibrary("marker");
    await google.maps.importLibrary("geometry");
    const targetLocation = { lat: 24.239268, lng: 120.623498 };
    
    // 建立新 Map
    map = new google.maps.Map(document.getElementById("map"), {
        center: targetLocation,
        zoom: 14,
        mapId: CLEAN_MAP_ID,
        disableDefaultUI: false
    });

    await fetchCameraData();
    setupToggleStyleButton();
    setupRouteButton();
    setupWallDragAndDrop();

    // 初始化叢集
    markerCluster = new markerClusterer.MarkerClusterer({
        map: map,
        markers: [],
        algorithm: new markerClusterer.SuperClusterAlgorithm({ radius: 60 })
    });

    // 綁定動態 viewport 渲染
    map.addListener("idle", () => {
        console.log("[效能動態] 地圖觸發 idle，更新可視區域標記...");
        updateMarkersInViewport();
    });

    // 300ms 雙重保險強制渲染
    setTimeout(() => {
        console.log("[效能動態] 啟動初始化強行渲染...");
        updateMarkersInViewport();
    }, 300);
}

/**
 * 🚀 WebGL 記憶體物理性淨化 & Map ID 無縫轉移
 * 徹底解決 "Too many active WebGL contexts" 溢出，並同步保護 GPS 定位標記
 */
async function switchMapId(newMapId) {
    if (!map) return;

    console.log(`[地圖重構] 啟動 WebGL 上下文轉移程序 -> ${newMapId}`);

    // 1. 保存狀態快照
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // 2. 清理舊叢集
    if (markerCluster) {
        markerCluster.clearMarkers();
        markerCluster.setMap(null);
    }

    // 3. 卸載地圖上所有 Marker
    activeCamMarkers.forEach(marker => {
        marker.map = null;
    });

    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
    }

    // 【定位遷移防禦】暫時脫鉤 GPS 定位標記，避免隨舊地圖銷毀
    if (userLocationMarker) {
        userLocationMarker.map = null;
    }

    // 4. 清除 InfoWindow 記憶體溢出
    if (currentInfoWindow) {
        currentInfoWindow.close();
        if (infoWindowInterval) {
            clearInterval(infoWindowInterval);
            infoWindowInterval = null;
        }
    }

    // 🔥 5. 【最強防禦】物理消滅舊 <div> 節點，強迫瀏覽器垃圾回收釋放 WebGL
    const oldMapContainer = document.getElementById("map");
    if (oldMapContainer) {
        const mapParent = oldMapContainer.parentNode;
        const newMapContainer = document.createElement("div");
        newMapContainer.id = "map";
        newMapContainer.className = oldMapContainer.className; // 繼承原有 CSS 樣式與寬高
        mapParent.replaceChild(newMapContainer, oldMapContainer);
    }

    // 6. 重新建立全新的 Google Map 實例
    map = new google.maps.Map(document.getElementById("map"), {
        center: currentCenter,
        zoom: currentZoom,
        mapId: newMapId,
        disableDefaultUI: false
    });

    // 7. 復原標記
    activeCamMarkers.forEach(marker => {
        marker.map = map;
    });

    markerCache.forEach(marker => {
        if (marker.map !== null && !visibleMarkerIds.has(marker.id)) {
            marker.map = null; 
        }
    });

    // 8. 重新建立全新的 MarkerClusterer 
    markerCluster = new markerClusterer.MarkerClusterer({
        map: map,
        markers: activeCamMarkers,
        algorithm: new markerClusterer.SuperClusterAlgorithm({ radius: 60 })
    });
    
    map.addListener("idle", updateMarkersInViewport);

    // 9. 折線重新掛載
    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(map);
    }

    // 【定位遷移復原】GPS 定位點掛載回全新地圖
    if (userLocationMarker) {
        userLocationMarker.map = map;
    }

    console.log(`[系統通知] 節點物理置換成功。WebGL 記憶體已釋放，已無縫轉移。`);
    setupWallDragAndDrop();
}

/**
 * 景點圖層切換
 */
async function togglePoiLayer() {
    isPoiVisible = !isPoiVisible;
    const targetMapId = isPoiVisible ? NORMAL_MAP_ID : CLEAN_MAP_ID;
    await switchMapId(targetMapId);

    const toggleBtn = document.getElementById("togglePoiBtn");
    if (toggleBtn) {
        toggleBtn.textContent = isPoiVisible ? "關閉景點顯示" : "顯示周邊景點";
    }
}

function setupToggleStyleButton() {
    const btn = document.getElementById("togglePoiBtn");
    if (btn) btn.addEventListener("click", togglePoiLayer);
}

function setupRouteButton() {
    document.getElementById("routeBtn")?.addEventListener("click", calculateAndDisplayRoute);
    document.getElementById("clearRouteBtn")?.addEventListener("click", () => {
        if (currentRoutePolyline) {
            currentRoutePolyline.setMap(null);
            currentRoutePolyline = null;
        }
        resetMapToAllCameras();
    });
}

// 綁定全域
window.initMap = initMap;
window.switchMapId = switchMapId;
window.togglePoiLayer = togglePoiLayer;