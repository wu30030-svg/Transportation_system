/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 3: gps-tracker.js - 📡 GPS 戰術定位追蹤
 */
/**
 * 使用者 GPS 即時追蹤主控開關 (v1.5.3 方案 A 標準版)
 * 完美對接 HTML 傳遞的 this 元素，具備高度防禦力與完全主導權
 */
function toggleUserLocation(checkbox) {
    const target = checkbox || document.getElementById("gps-tracking-toggle");
    
    if (!target) {
        console.error("[定位系統] 找不到 'gps-tracking-toggle' 開關節點，運作中止。");
        return;
    }

    // 方案 A 核心：直接讀取元件的 checked 狀態
    if (target.checked) {
        console.log("[定位系統] 啟動使用者 GPS 即時追蹤...");

        if (!navigator.geolocation) {
            alert("您的瀏覽器或環境不支援 Geolocation 定位功能！");
            target.checked = false; // 反向取消勾選
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
                    pinElement.innerHTML = `
                        <div style="width:18px;height:18px;background-color:#007bff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(0,123,255,0.9);animation:gps-pulse 2s infinite;"></div>
                        <style>
                        @keyframes gps-pulse{
                            0%{transform:scale(0.9);box-shadow:0 0 0 0 rgba(0,123,255,0.8);}
                            70%{transform:scale(1);box-shadow:0 0 0 10px rgba(0,123,255,0);}
                            100%{transform:scale(0.9);box-shadow:0 0 0 0 rgba(0,123,255,0);}
                        }
                        </style>
                    `;
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
                target.checked = false; // 定位崩潰時反向保險，防 UI 錯亂
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

// 🔥 關鍵安全對接：掛載至 window 全域，徹底解決 HTML 中 onchange 找不到函數的問題
window.toggleUserLocation = toggleUserLocation;
window.stopUserLocationTracking = stopUserLocationTracking;