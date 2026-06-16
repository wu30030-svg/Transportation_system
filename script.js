let map;                  // 宣告在外面，讓按鈕事件也能讀取到這個地圖
let isPoiVisible = false; // 紀錄目前狀態（一開始是隱藏，所以是 false）

// 📢 用來處理路徑規劃的兩個全域變數
let directionsService;
let directionsRenderer;

// 🚀 監視器專用的全域變數
let allCams = [];           // 存放從 api 抓下來的全台灣監視器大清單
let activeCamMarkers = [];  // 紀錄目前在地圖上「標出來」的監視器地標，方便下次換路線時清空
let wallRefreshIntervals = [null, null, null, null]; // 紀錄 4 個格子的定時器
let manualSlotIndex = 0;                            // 紀錄目前點擊該填入第幾格

// 🌟 【新增全域控制】防範記憶體洩漏，確保網頁同時只存在一個泡泡與一個計時器
let currentInfoWindow = null;
let infoWindowInterval = null;

// 取得網頁上的按鈕
const button = document.getElementById('clickBtn');

// 監聽按鈕點擊事件
if (button) {
    button.addEventListener('click', () => {
        alert('太棒了！你的 JavaScript 成功執行了！');
    });
}

// 定義「隱藏景點與大眾運輸」的樣式表
const hidePoiStyles = [
    {
        featureType: "poi", elementType: "all",    // poi 代表 Points of Interest
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "transit", elementType: "all",// transit 代表大眾運輸
        stylers: [{ visibility: "off" }]
    }
];

// 把這個函式掛載到全域的 window 物件上
window.initMap = initMap;

function initMap() {
    // 1. 設定你想顯示的中心點經緯度（以台中北大營區 為例）
    const targetLocation = { lat: 24.239268, lng: 120.623498 };

    // 2. 建立地圖物件
    map = new google.maps.Map(document.getElementById("map"), {
        center: targetLocation,
        zoom: 16, 
        styles: hidePoiStyles // 一開始初始化就直接套用「隱藏樣式」
    });

    // 初始化路徑規劃服務
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); 

    // 🚀 監視器新增：地圖一打開，就先去後台把全台灣的監視器抓下來存著
    fetchCameraData();

    // 綁定「規劃路線」按鈕的點擊事件
    const routeBtn = document.getElementById('routeBtn');
    if (routeBtn) {
        routeBtn.addEventListener('click', calculateAndDisplayRoute);
    }
    
    // 3. 啟動按鈕的點擊監聽功能
    setupToggleStyleButton();
}

// 負責處理按鈕切換的函式
function setupToggleStyleButton() {
    const toggleBtn = document.getElementById('togglePoiBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isPoiVisible = !isPoiVisible; 

            if (isPoiVisible) {
                map.setOptions({ styles: [] });
                toggleBtn.textContent = "隱藏景點資訊";
            } else {
                map.setOptions({ styles: hidePoiStyles });
                toggleBtn.textContent = "顯示景點資訊";
            }
        });
    }
}

// 負責計算並顯示路線的函式
function calculateAndDisplayRoute() {
    const start = document.getElementById("startInput").value;
    const end = document.getElementById("endInput").value;

    if (!start || !end) {
        alert("請輸入起始地與目的地！");
        return;
    }

    directionsService.route(
        {
            origin: start,
            destination: end,      
            travelMode: google.maps.TravelMode.DRIVING 
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                // 路線畫好後，立刻把資料丟給篩選器
                filterAndShowRouteCameras(response);
            } else {
                alert("路線規劃失敗，原因: " + status);
            }
        }
    );
}

// 🚀 負責去伺服器抓取全台監視器 JSON 清單
function fetchCameraData() {
    fetch('cam-list.json') 
        .then(response => {
            if (!response.ok) throw new Error('讀取本地 json 失敗');
            return response.json();
        })
        .then(data => {
            allCams = data;
            console.log(`[成功] 已從本地檔案預先載入全台 ${allCams.length} 支監視器！`);
        })
        .catch(err => console.error("監視器資料讀取失敗:", err));
}

// 🚀 核心邏輯——篩選並在地圖上顯示路線周圍的監視器
function filterAndShowRouteCameras(response) {
    clearAllCamMarkers(); // 每次規劃新路線，先清除上一次的地標、泡泡與計時器

    const routePath = response.routes[0].overview_path;
    const currentRoutePolyline = new google.maps.Polyline({ path: routePath });

    // 💡 調整：0.0002 大約是左右各 50 公尺
    const toleranceOffset = 0.0005;

    allCams.forEach(cam => {
        const camLatLng = new google.maps.LatLng(cam.lat, cam.lon);

        const isOnRoute = google.maps.geometry.poly.isLocationOnEdge(
            camLatLng,
            currentRoutePolyline,
            toleranceOffset
        );

        if (isOnRoute) {
            createCamMarker(cam);
        }
    });
}

// 🚀 橡皮擦功能：負責把畫面上的監視器地標清空，並順手掐死活著的計時器
function clearAllCamMarkers() {
    // 🌟 安全機制：換路線時，把還開著的計時器與泡泡一起陪葬，防止記憶體洩漏
    if (infoWindowInterval) {
        clearInterval(infoWindowInterval);
        infoWindowInterval = null;
    }
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }

    activeCamMarkers.forEach(marker => marker.setMap(null));
    activeCamMarkers = []; 
}

// 🚀 畫上監視器大頭針
function createCamMarker(cam) {
    const btnId = `wall-btn-${Math.random().toString(36).substr(2, 9)}`;
    const imgId = `map-img-${Math.random().toString(36).substr(2, 9)}`;

    const marker = new google.maps.Marker({
        position: { lat: cam.lat, lng: cam.lon }, 
        map: map,                                 
        title: cam.name,                          
    });

    // 當使用者點擊大頭針時
    marker.addListener('click', () => {
        
        // 🌟 1. 檢查並關閉前一個打開的計時器與泡泡
        if (infoWindowInterval) {
            clearInterval(infoWindowInterval);
            infoWindowInterval = null;
        }
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }

        // 2. 實例化新泡泡，並由全域變數接管
        currentInfoWindow = new google.maps.InfoWindow({
            content: `
                <div style="width: 250px; font-family: 'Microsoft JhengHei', sans-serif;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${cam.name}</h4>
                    <img id="${imgId}" src="${cam.cam_url}" alt="即時路況" style="width: 100%; border-radius: 4px; border: 1px solid #ddd; display: block; margin-bottom: 8px;">
                    <button id="${btnId}" style="width: 100%; padding: 6px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
                        📺 監控此畫面 (載入電視牆)
                    </button>
                </div>
            `
        });

        currentInfoWindow.open(map, marker);

        // 3. 當對話框渲染完畢 (domready)
        currentInfoWindow.addListener('domready', () => {
            // 修正：統一指派給全域的 infoWindowInterval 變數
            infoWindowInterval = setInterval(() => {
                const imgElement = document.getElementById(imgId);
                if (imgElement) {
                    imgElement.src = `${cam.cam_url}?t=${Date.now()}`;
                }
            }, 3000);

            // 綁定手動電視牆派件按鈕
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    addCamToWallManually(cam);
                });
            }
        });

        // 4. 使用者主動點擊 X 關閉時
        currentInfoWindow.addListener('closeclick', () => {
            if (infoWindowInterval) {
                clearInterval(infoWindowInterval);
                infoWindowInterval = null;
                console.log(`[通知] 已關閉 ${cam.name} 的定時刷新`);
            }
        });
    });

    activeCamMarkers.push(marker);
}

// 🚀 手動按鈕觸發：將畫面塞進電視牆
function addCamToWallManually(cam) {
    setWallSlot(manualSlotIndex, cam);
    console.log(`[手動監控] 已將 ${cam.name} 指派至電視牆 CH${manualSlotIndex + 1}`);
    manualSlotIndex = (manualSlotIndex + 1) % 4; // 0 -> 1 -> 2 -> 3 -> 0 循環
}

// 🚀 電視牆核心：負責把單一隻監視器塞進指定的格子並定時刷新
function setWallSlot(i, cam) {
    if (wallRefreshIntervals[i]) clearInterval(wallRefreshIntervals[i]);

    const cell = document.getElementById(`cam-wall-${i}`);
    if (!cell) return;

    if (cam) {
        cell.innerHTML = `
            <img id="wall-img-${i}" src="${cam.cam_url}" alt="${cam.name}">
            <div class="cam-name-label">📡 CH${i + 1}: ${cam.name}</div>
        `;

        wallRefreshIntervals[i] = setInterval(() => {
            const imgElement = document.getElementById(`wall-img-${i}`);
            if (imgElement) {
                imgElement.src = `${cam.cam_url}?t=${Date.now()}`;
            }
        }, 3000);
    }
}