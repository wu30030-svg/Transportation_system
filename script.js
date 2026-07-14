/**
 * 戰略中心 - 路線監視面板系統 (動態重構與戰術定位版 - v1.5.2)
 * * 融合規範說明：
 * 1. 核心突破：攻克 mapId 唯讀限制，實作 switchMapId() 完整保留地圖狀態與既有標記實例。
 * 2. 歷史防禦完美保留：
 * - v1.2: 2026 Routes API (fields 遮罩、自動解碼 path) 與全域單一 InfoWindow 防溢出。
 * - v1.3: HTML5 原生拖曳派件 (Drag & Drop) 與 CH1~CH4 電視牆科技綠光提示。
 * - v1.3.1: AdvancedMarkerElement 強制啟用 gmpClickable: true 解鎖紅點點擊。
 * - v1.3.2: getCacheBusterUrl() 智慧排解公部門 CCTV 網址雙問號 400 Bad Request 阻斷。
 * - v1.5.1: WebGL DOM 物理節點置換淨化術，徹底斷絕 "Too many active WebGL contexts" 記憶體溢出。
 * - v1.5.2: 新增 GPS 即時動態定位（脈衝藍光定位點），並納入 switchMapId() 樣式切換無縫遷移陣列。
 */

let map;                          // 全域地圖物件
let markerCluster = null;         // 地圖叢集管理器
let isPoiVisible = false;         // 景點層與地圖 ID 控制開關

const CLEAN_MAP_ID = "4226f603895ec596617ae2e5";   // 請確認此處替換為您的國防/純淨版 Map ID
const NORMAL_MAP_ID = "4226f603895ec596b144d9c8"; // 請確認此處替換為您的常規/顯示景點 Map ID

// 路線規劃全域變數
let currentRoutePolyline = null;

// 監視器數據與標記 (遵循純淨版變數命名)
let allCams = [];           
let activeCamMarkers = [];

// 電視牆核心變數
let wallRefreshIntervals = [null, null, null, null];
let manualSlotIndex = 0;

// 防範記憶體洩漏核心防禦
let currentInfoWindow = null;
let infoWindowInterval = null;

// 📡 戰術定位全域變數
let userLocationMarker = null;   // 全域使用者定位標記 (AdvancedMarkerElement)
let userLocationWatchId = null;  // Geolocation 即時監聽器 


/**
 * 1. 初始化地圖
 */
async function initMap() {
    const targetLocation = { lat: 24.239268, lng: 120.623498 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        center: targetLocation,
        zoom: 14,
        mapId: CLEAN_MAP_ID,
        disableDefaultUI: false
    });

    fetchCameraData();
    setupToggleStyleButton();
    setupRouteButton();
    setupWallDragAndDrop(); // 初始化電視牆拖曳監聽

    google.maps.event.addListenerOnce(map, "idle", () => {
        console.log("[系統提示] 戰略地圖已安全載入完成.");
    });
}
window.initMap = initMap;

/**
 * 2. 🚀 核心優化：動態切換 Map ID (v1.5.2 WebGL 記憶體淨化與定位點無縫遷移版)
 * 解決問題：徹底根除 "Too many active WebGL contexts" 警告與記憶體洩漏，並同步保障 GPS 定位標記不丟失
 */
async function switchMapId(newMapId) {
    if (!map) return;

    console.log(`[地圖重構] 啟動 MapID 轉移程序 -> ${newMapId}`);

    // Step 2.1: 保存目前地圖狀態快照
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Step 2.2: 清除舊的 MarkerClusterer
    if (markerCluster) {
        markerCluster.clearMarkers();
        markerCluster.setMap(null);
    }

    // Step 2.3: 將現有的進階標記暫時與舊地圖脫鉤
    activeCamMarkers.forEach(marker => {
        marker.map = null;
    });

    // Step 2.4: 若有導航線，亦先與舊地圖脫鉤
    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
    }

    // 🔥 Step 2.4.1: 【定位遷移防禦】若有 GPS 即時定位標記，亦先與舊地圖脫鉤，防止其隨舊地圖一同被銷毀
    if (userLocationMarker) {
        userLocationMarker.map = null;
    }

    // Step 2.5: 安全防禦：關閉當前開啟的 InfoWindow 
    if (currentInfoWindow) {
        currentInfoWindow.close();
        if (infoWindowInterval) {
            clearInterval(infoWindowInterval);
            infoWindowInterval = null;
        }
    }

    // 🔥 Step 2.6: 【核心防禦】物理銷毀舊 DOM 節點，強迫瀏覽器釋放 WebGL 上下文
    const oldMapContainer = document.getElementById("map");
    if (oldMapContainer) {
        const mapParent = oldMapContainer.parentNode;
        
        // 建立一個完全同名、同規格的全新 <div> 容器
        const newMapContainer = document.createElement("div");
        newMapContainer.id = "map";
        newMapContainer.className = oldMapContainer.className; // 繼承原有 CSS 樣式與寬高
        
        // 用新容器取代舊容器（舊容器連同其內部的 WebGL 畫布會被徹底丟進垃圾回收機制）
        mapParent.replaceChild(newMapContainer, oldMapContainer);
    }

    // Step 2.7: 在全新的乾淨容器上，重新建立 google.maps.Map 實例
    map = new google.maps.Map(document.getElementById("map"), {
        center: currentCenter,
        zoom: currentZoom,
        mapId: newMapId,
        disableDefaultUI: false
    });

    // Step 2.8: 關鍵復原：將標記實例重新綁定至新地圖
    activeCamMarkers.forEach(marker => {
        marker.map = map;
    });

    // Step 2.9: 重新建立全新的 MarkerClusterer 叢集管理器
    markerCluster = new markerClusterer.MarkerClusterer({
        map: map,
        markers: activeCamMarkers,
        algorithm: new markerClusterer.SuperClusterAlgorithm({ radius: 60 })
    });

    // Step 2.10: 若原本有導航折線，同步重新掛載回新地圖
    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(map);
    }

    // 🔥 Step 2.11: 【定位遷移復原】若 GPS 即時定位標記存在，同步掛載至全新的地圖實例
    if (userLocationMarker) {
        userLocationMarker.map = map;
    }

    console.log(`[系統通知] 節點置換成功。WebGL 記憶體已完全淨化，現行導航、標記與 GPS 定位已絲滑移轉。`);
    setupWallDragAndDrop();
}

/**
 * 3. 景點圖層開關切換 (改為呼叫新型 switchMapId)
 */
async function togglePoiLayer() {
    isPoiVisible = !isPoiVisible;
    const targetMapId = isPoiVisible ? NORMAL_MAP_ID : CLEAN_MAP_ID;
    
    // 執行重構切換
    await switchMapId(targetMapId);

    const toggleBtn = document.getElementById("togglePoiBtn");
    if (toggleBtn) {
        toggleBtn.textContent = isPoiVisible ? "關閉景點顯示" : "顯示周邊景點";
    }
}

/**
 * 4. 智慧防快取網址解析工具 (防止雙問號導致 400 Bad Request)
 */
function getCacheBusterUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
}

/**
 * 5. 撈取並建立全台監視器 (使用 AdvancedMarkerElement，開啟 gmpClickable)
 */
function fetchCameraData() {
    fetch('cam-list.json')
        .then(response => {
            if (!response.ok) throw new Error('讀取本地 json 失敗');
            return response.json();
        })
        .then(data => {
            allCams = data;
            activeCamMarkers = allCams.map(cam => {
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: parseFloat(cam.lat), lng: parseFloat(cam.lon) },
                    title: cam.name,
                    map: map,
                    gmpClickable: true // 🔥 關鍵解鎖：允許新版進階標記接收點擊事件
                });

                marker.addEventListener("gmp-click", () => {
                    openMonitorInfoWindow(marker, cam);
                });
                return marker;
            });

            // 初始化叢集管理器 (SuperClusterAlgorithm)
            markerCluster = new markerClusterer.MarkerClusterer({
                map: map,
                markers: activeCamMarkers,
                algorithm: new markerClusterer.SuperClusterAlgorithm({ radius: 60 })
            });

            console.log(`[成功] 已預先載入全台 ${allCams.length} 支監視器並建立數字叢集。`);
        })
        .catch(err => console.error("資料讀取失敗:", err));
}

/**
 * 6. 重設地圖 (清除導航，還原全台監視器標記)
 */
function resetMapToAllCameras() {
    if (markerCluster) markerCluster.clearMarkers();
    activeCamMarkers.forEach(m => m.map = null);

    activeCamMarkers = allCams.map(cam => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: parseFloat(cam.lat), lng: parseFloat(cam.lon) },
            title: cam.name,
            map: map,
            gmpClickable: true // 🔥 解鎖點擊
        });
        marker.addEventListener("gmp-click", () => openMonitorInfoWindow(marker, cam));
        return marker;
    });

    if (markerCluster) markerCluster.addMarkers(activeCamMarkers);
    console.log("[系統重設] 已還原全台所有監視器叢集。");
}

/**
 * 7. 核心空間篩選 (沿線過濾)
 */
function filterAndShowRouteCameras(decodedPath) {
    if (markerCluster) markerCluster.clearMarkers();
    activeCamMarkers.forEach(m => m.map = null);
    activeCamMarkers = [];
    
    const toleranceOffset = 0.0005; // 空間篩選容許誤差值

    allCams.forEach(cam => {
        const camLatLng = new google.maps.LatLng(parseFloat(cam.lat), parseFloat(cam.lon));
        if (google.maps.geometry.poly.isLocationOnEdge(camLatLng, currentRoutePolyline, toleranceOffset)) {
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: camLatLng,
                title: cam.name,
                map: map,
                gmpClickable: true // 🔥 解鎖點擊
            });
            marker.addEventListener("gmp-click", () => openMonitorInfoWindow(marker, cam));
            activeCamMarkers.push(marker);
        }
    });

    if (markerCluster) markerCluster.addMarkers(activeCamMarkers);
    console.log(`[空間篩選] 導航沿線篩選完成！目前地圖僅保留沿線 ${activeCamMarkers.length} 支監視器。`);
}

/**
 * 8. 導航計算核心 (2026 Routes API)
 */
async function calculateAndDisplayRoute() {
    const start = document.getElementById("startInput").value;
    const end = document.getElementById("endInput").value;
    if (!start || !end) {
        window.alert("請輸入起始地與目的地！");
        return;
    }

    if (currentRoutePolyline) {
        currentRoutePolyline.setMap(null);
        currentRoutePolyline = null;
    }

    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        fields: ['path', 'viewport'] // 強制指定欄位遮罩
    };

    try {
        console.log("[系統] 正在呼叫 2026 全新 Routes API...");
        const { Route } = await google.maps.importLibrary("routes");
        const response = await Route.computeRoutes(request);

        if (response && response.routes && response.routes.length > 0) {
            const route = response.routes[0];
            const decodedPath = route.path; // SDK 已自動解碼經緯度陣列

            if (!decodedPath || decodedPath.length === 0) {
                window.alert("未找到有效路線的路徑資料");
                return;
            }

            currentRoutePolyline = new google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 6,
                map: map
            });

            if (route.viewport) {
                map.fitBounds(route.viewport);
            } else {
                const bounds = new google.maps.LatLngBounds();
                decodedPath.forEach(latLng => bounds.extend(latLng));
                map.fitBounds(bounds);
            }

            filterAndShowRouteCameras(decodedPath);
        } else {
            window.alert("未找到有效路線");
        }
    } catch (error) {
        console.error("新版導航連線失敗:", error);
        window.alert("新版路線規劃失敗，請確認 GCP 主控台已啟用 Routes API (New)。");
    }
}

/**
 * 9. 開啟路況資訊視窗 (整合 HTML5 原生拖曳機能)
 */

function openMonitorInfoWindow(marker, cam) {
    // 【v1.2 記憶體防禦】開啟新泡泡前先清除舊有計時器與視窗，徹底斷絕記憶體洩漏
    if (infoWindowInterval) clearInterval(infoWindowInterval);
    if (currentInfoWindow) currentInfoWindow.close();

    // 【安全強化】將物件轉為 JSON 並將雙引號轉義為 &quot; 
    // 這樣放入 HTML 屬性時能完美防範單引號/特殊字元造成的語法崩潰與破圖
    const camJsonStr = JSON.stringify(cam).replace(/"/g, '&quot;');

    // 計算當前手動派件的頻道顯示文字
    const nextChLabel = (typeof manualSlotIndex !== 'undefined' ? manualSlotIndex : 0) + 1;

    currentInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="color:#000; font-family:sans-serif; width:220px;">
                <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:bold; color:#111;">${cam.name}</h4>
                
                <div style="font-size:11px; color:#007bff; font-weight:bold; margin-bottom:6px; display:flex; align-items:center; gap:2px;">
                    <span>⚡ 支援影像「滑鼠拖曳」派件</span>
                </div>

                <div draggable="true" 
                     ondragstart="window.handleDragStart(event, ${camJsonStr})" 
                     style="background:#000; aspect-ratio:16/9; display:flex; justify-content:center; align-items:center; overflow:hidden; border-radius:4px; cursor:grab; border: 2px dashed #007bff;"
                     title="滑鼠按住此處拖曳至下方電視牆">
                     
                    <img id="info-window-img" 
                         src="${getCacheBusterUrl(cam.cam_url)}" 
                         style="width:100%; height:100%; object-fit:cover; pointer-events: none;" 
                         onerror="this.src='https://placehold.co/640x360/000000/444444?text=NO+SIGNAL'">
                </div>

                <button onclick="window.addCamToWallManually(${camJsonStr})" 
                        style="margin-top:8px; width:100%; padding:6px; background:#007bff; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; transition: background 0.2s;">
                    點擊按鈕派件 (CH${nextChLabel})
                </button>
            </div>
        `
    });

    currentInfoWindow.open(map, marker);

    // 【v1.4.0 修正】資訊視窗內的 3 秒智慧破壞快取重新整理
    infoWindowInterval = setInterval(() => {
        const img = document.getElementById("info-window-img");
        if (img) {
            img.src = getCacheBusterUrl(cam.cam_url);
        }
    }, 3000);

    // 【v1.2 記憶體防禦】監聽手動關閉事件，精準清除計時器
    google.maps.event.addListener(currentInfoWindow, "closeclick", () => {
        if (infoWindowInterval) {
            clearInterval(infoWindowInterval);
            infoWindowInterval = null;
            console.log(`[安全性清理] 已安全關閉 ${cam.name} 的彈出視窗計時器。`);
        }
    });
}

/**
 * 9-B. HTML5 拖曳起始封包設定（必須掛載於 window 下以供全域呼叫）
 */
function handleDragStart(event, cam) {
    // 重新注入標準 HTML5 拖曳封包，讓電視牆的 drop 監聽器能正常解碼 JSON
    event.dataTransfer.setData("application/json", JSON.stringify(cam));
    event.dataTransfer.effectAllowed = "copyMove";
    
    // 備用防線：同時將物件暫存於全域變數，雙重防禦
    window.currentDraggedCam = cam;
    
    console.log(`[滑鼠拖曳] 已成功擷取監視器訊號來源: ${cam.name}`);
}
window.handleDragStart = handleDragStart;

/**
 * 11-B. HTML5 電視牆拖放控制中心 (v1.5.3)
 * --------------------------------------------------------
 * 功能：
 * 1. 初始化四宮格拖曳事件
 * 2. 支援 application/json
 * 3. 若瀏覽器阻擋 DataTransfer，改用全域備援 currentDraggedCam
 * --------------------------------------------------------
 */
function setupWallDragAndDrop() {

    console.log("[電視牆] 初始化 HTML5 Drag & Drop...");

    for (let i = 0; i < 4; i++) {

        const cell = document.getElementById(`slot-${i}`);

        if (!cell) {
            console.error(`[電視牆] 找不到 slot-${i}`);
            continue;
        }

        // 拖曳經過
        cell.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        });

        // 放開滑鼠
        cell.addEventListener("drop", (event) => {

            event.preventDefault();

            let cam = null;

            try {

                const json =
                    event.dataTransfer.getData("application/json");

                if (json) {
                    cam = JSON.parse(json);
                }

            } catch (err) {
                console.warn("[拖曳] JSON 解碼失敗，改採備援模式。");
            }

            // 備援方案
            if (!cam) {
                cam = window.currentDraggedCam;
            }

            if (cam) {

                console.log(`[拖曳成功] ${cam.name} → CH${i + 1}`);

                setWallSlot(i, cam);

            } else {

                console.warn("[拖曳失敗] 找不到監視器資料");

            }

        });

    }

    console.log("[電視牆] 拖放事件初始化完成。");
}

window.setupWallDragAndDrop = setupWallDragAndDrop;

/**
 * 10. 2x2 電視牆控制中心
 */
function addCamToWallManually(cam) {
    setWallSlot(manualSlotIndex, cam);
    manualSlotIndex = (manualSlotIndex + 1) % 4; 
}
window.addCamToWallManually = addCamToWallManually;

/**
 * 一鍵清空四宮格電視牆
 */
function clearAllWallSlots() {

    console.log("[電視牆] 清空所有頻道");

    for(let i=0;i<4;i++){

        if(wallRefreshIntervals[i]){
            clearInterval(wallRefreshIntervals[i]);
            wallRefreshIntervals[i]=null;
        }

        const cell=document.getElementById(`slot-${i}`);

        if(cell){

            cell.innerHTML=`
                <span class="placeholder">
                    NO SIGNAL
                </span>
            `;

        }

    }

    manualSlotIndex=0;
}

window.clearAllWallSlots=clearAllWallSlots;
/**
 * 電視牆單一頻道派件 (v1.5.3)
 */
function setWallSlot(i, cam) {

    if (wallRefreshIntervals[i]) {
        clearInterval(wallRefreshIntervals[i]);
    }

    const cell = document.getElementById(`slot-${i}`);

    if (!cell) {
        console.error(`找不到 slot-${i}`);
        return;
    }

    cell.innerHTML = `
        <div style="position:relative;width:100%;height:100%;">

            <div style="
                position:absolute;
                top:4px;
                left:4px;
                z-index:10;
                color:#00ff00;
                background:rgba(0,0,0,.6);
                padding:2px 6px;
                border-radius:3px;
                font-size:12px;
                font-family:monospace;">

                📡 CH${i+1}
                <br>
                ${cam.name}

            </div>

            <img
                id="wall-img-${i}"
                src="${getCacheBusterUrl(cam.cam_url)}"
                style="width:100%;height:100%;object-fit:cover;"
                onerror="this.src='https://placehold.co/640x360/000000/444444?text=NO+SIGNAL'">

        </div>
    `;

    wallRefreshIntervals[i] = setInterval(() => {

        const img =
            document.getElementById(`wall-img-${i}`);

        if (img) {
            img.src =
                getCacheBusterUrl(cam.cam_url);
        }

    },3000);

    console.log(`[電視牆] CH${i+1} 已派件：${cam.name}`);
}


/**
 * 11. UI 監聽與按鈕事件綁定
 */
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

/**
 * 📡 戰略中心 - 使用者 GPS 即時追蹤模組 (v1.5.3 方案 A 標準版)
 * 完美對接 HTML 傳遞的 this 元素，具備高防禦力與元件完全主導權
 */
function toggleUserLocation(checkbox) {
    // 優先使用傳入的元件，若無則依據最新戰術 ID 自動搜尋
    const target = checkbox || document.getElementById("gps-tracking-toggle");
    
    if (!target) {
        console.error("[定位系統] 找不到 'gps-tracking-toggle' 開關節點，作戰中斷。");
        return;
    }

    // 方案 A 核心：直接讀取元件的 checked 狀態
    if (target.checked) {
        console.log("[定位系統] 啟動使用者 GPS 即時追蹤...");

        if (!navigator.geolocation) {
            alert("您的瀏覽器或環境不支援 Geolocation 定位功能！");
            target.checked = false; // 反向沒收勾選狀態
            return;
        }

        // 啟動高精準度動態追蹤
        userLocationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log(`[定位成功] 目前座標: Lat ${userLatLng.lat}, Lng ${userLatLng.lng}`);

                // 更新地圖藍點
                if (userLocationMarker) {
                    userLocationMarker.position = userLatLng;
                } else {
                    const pinElement = document.createElement("div");
                    pinElement.innerHTML = `<div style="width:18px;height:18px;background-color:#007bff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(0,123,255,0.9);animation:gps-pulse 2s infinite;"></div><style>@keyframes gps-pulse{0%{transform:scale(0.9);box-shadow:0 0 0 0 rgba(0,123,255,0.8);}70%{transform:scale(1);box-shadow:0 0 0 10px rgba(0,123,255,0);}100%{transform:scale(0.9);box-shadow:0 0 0 0 rgba(0,123,255,0);}}</style>`;
                    userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
                        map: map,
                        position: userLatLng,
                        title: "您的當前位置",
                        content: pinElement
                    });
                }
                map.panTo(userLatLng);
            },
            (error) => {
                console.error("[定位失敗]", error);
                alert("定位失敗，請確認已開啟裝置 GPS 並允許網頁存取定位權限。");
                target.checked = false; // 定位崩潰時，自動取消勾選，防止 UI 狀態錯亂
                stopUserLocationTracking();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

    } else {
        console.log("[定位系統] 已手動關閉使用者 GPS 追蹤。");
        stopUserLocationTracking();
    }
}

// 🔥 關鍵對接：將追蹤開關掛載至 window 全域，完美解決 HTML onchange 找不到定位的問題
window.toggleUserLocation = toggleUserLocation;

/**
 * 徹底清除定位狀態，防止背景空轉洩漏
 */
function stopUserLocationTracking() {
    if (userLocationWatchId !== null) {
        navigator.geolocation.clearWatch(userLocationWatchId);
        userLocationWatchId = null;
    }
    if (userLocationMarker) {
        userLocationMarker.map = null;
        userLocationMarker = null;
    }
}
window.stopUserLocationTracking = stopUserLocationTracking;