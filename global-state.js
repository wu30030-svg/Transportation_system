/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 1: global-state.js - 全域狀態與配置管理中心
 */
// 🗺️ 地圖與叢集核心實例
var map;                          // 全域地圖物件
var markerCluster = null;         // 地圖叢集管理器
var isPoiVisible = false;         // 景點層與地圖 ID 控制開關

// 🎨 地圖樣式 ID 配置 (Cloud-based Map Styling)
var CLEAN_MAP_ID = "4226f603895ec596617ae2e5";   // 國防/純淨版 Map ID
var NORMAL_MAP_ID = "4226f603895ec596b144d9c8";  // 常規/顯示景點 Map ID

// 🗺️ 路線規劃與 CCTV 暫存
var currentRoutePolyline = null; // 路線規劃全域折線
var allCams = [];                // 存放所有撈取出的 CCTV 原始數據
var activeCamMarkers = [];       // 目前啟用中/地圖上可見的 CCTV 標記陣列

// 📺 電視牆核心變數
var wallRefreshIntervals = [null, null, null, null]; // 電視牆四個頻道的獨立更新計時器
var manualSlotIndex = 0;                             // 手動點擊派件時的頻道輪替指標
var currentDraggedCam = null;                        // HTML5 拖曳暫存的 CCTV 物件

// 🛡️ 防範記憶體洩漏核心防禦 (InfoWindow)
var currentInfoWindow = null;
var infoWindowInterval = null;

// 📡 GPS 戰術定位變數
var userLocationMarker = null;   // 全域使用者定位標記 (AdvancedMarkerElement)
var userLocationWatchId = null;  // Geolocation 即時監聽器 

// ⚡ v1.6.0 效能防禦升級：快取池與狀態旗標
var markerCache = new Map();     // Marker 實例快取池 (鍵: cam_id, 值: AdvancedMarkerElement)
var visibleMarkerIds = new Set(); // 目前掛載於地圖上的 Marker ID 集合
var isRouteMode = false;          // 是否處於導航模式 (True 時暫停 Viewport 動態渲染)
var routeCamIds = new Set();       // 存放導航篩選出的 CCTV ID 集合

var selectedVehicleType = 'CAR';   // CAR / TRUCK
var isRouteEditable = false;        // 是否進入手動拖曳調整模式
var truckProfile = { height: 3.8, width: 2.5, weight: 20000 }; // 公尺/公斤，可依表單覆寫