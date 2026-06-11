let map;                  // 宣告在外面，讓按鈕事件也能讀取到這個地圖
let isPoiVisible = false; // 紀錄目前狀態（一開始是隱藏，所以是 false）
// 📢 新增：用來處理路徑規劃的兩個全域變數
let directionsService;
let directionsRenderer;

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
        featureType: "poi", elementType: "all",    // poi 代表 Points of Interest（商店、學校、景點等）
        stylers: [{ visibility: "off" }] // 強制隱藏
    },
    {
        featureType: "transit", elementType: "all",// transit 代表大眾運輸（捷運站、公車站牌）
        stylers: [{ visibility: "off" }] // 強制隱藏
    }
];

// 把這個函式掛載到全域的 window 物件上，確保 Google 的外掛腳本找得到它
window.initMap = initMap;
// 建立一個初始化地圖的函式
// 名字必須跟 HTML 裡面寫的 callback=initMap 一模一樣
function initMap() {
    
    // 1. 設定你想顯示的中心點經緯度（以台中北大營區 為例）
    const targetLocation = { lat: 24.239268, lng: 120.623498 };

    // 2. 建立地圖物件
    // 第一個參數：指定要把地圖塞進 HTML 的哪個元素（這裡用 id="map"）
    // 第二個參數：設定地圖的初始狀態（中心點、縮放大小）
    map = new google.maps.Map(document.getElementById("map"), {
        center: targetLocation,
        zoom: 16, // 縮放級別，數字越大越近（通常 15~17 適合城市街道）
        styles: hidePoiStyles // 一開始初始化就直接套用「隱藏樣式」
    });
    // 初始化路徑規劃服務，並把路線綁定到這張地圖上
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); // 告訴瀏覽器：路線要畫在這張地圖上
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
            isPoiVisible = !isPoiVisible; // 切換真假值狀態 (true 變 false，false 變 true)

            if (isPoiVisible) {
                // 如果要顯示：把樣式改為「空陣列 []」，地圖就會恢復原廠預設狀態
                map.setOptions({ styles: [] });
                toggleBtn.textContent = "隱藏景點資訊";
            } else {
                // 如果要隱藏：重新套用我們寫好的「隱藏樣式」
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

    // 防呆：如果沒填寫就不執行
    if (!start || !end) {
        alert("請輸入起始地與目的地！");
        return;
    }

    // 發送請求給 Google 伺服器計算路線
    directionsService.route(
        {
            origin: start,destination: end,      // 起點文字,終點文字
            travelMode: google.maps.TravelMode.DRIVING // 交通模式：開車 (DRIVING)、走路 (WALKING)
        },
        (response, status) => {
            if (status === "OK") {
                // 如果計算成功，叫 Renderer 把藍色的路線線條直接畫在地圖上
                directionsRenderer.setDirections(response);
            } else {
                alert("路線規劃失敗，原因: " + status);
            }
        }
    );
}
