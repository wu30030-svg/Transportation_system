/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 4: monitor-wall.js - 📺 2x2 四分格電視牆控制中心
 */
/**
 * 手動點擊派件：循環填入 1~4 頻道
 */
function addCamToWallManually(cam) {
    setWallSlot(manualSlotIndex, cam);
    manualSlotIndex = (manualSlotIndex + 1) % 4; 
}

/**
 * 電視牆單一頻道派件與計時器管理 (v1.5.3)
 */
function setWallSlot(i, cam) {
    // 優先清除該頻道的舊計時器，徹底斷絕記憶體洩漏
    if (wallRefreshIntervals[i]) {
        clearInterval(wallRefreshIntervals[i]);
    }

    const cell = document.getElementById(`slot-${i}`);
    if (!cell) {
        console.error(`[電視牆] 找不到 slot-${i}`);
        return;
    }

    // 注入即時影像與 CH1~CH4 綠光標籤
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
                📡 CH${i+1} <br>
                ${cam.name}
            </div>
            <img
                id="wall-img-${i}"
                src="${getCacheBusterUrl(cam.cam_url)}"
                style="width:100%;height:100%;object-fit:cover;"
                onerror="this.src='https://placehold.co/640x360/000000/444444?text=NO+SIGNAL'">
        </div>
    `;

    // 啟動 3 秒智慧獨立更新
    wallRefreshIntervals[i] = setInterval(() => {
        const img = document.getElementById(`wall-img-${i}`);
        if (img) {
            img.src = getCacheBusterUrl(cam.cam_url);
        }
    }, 3000);

    console.log(`[電視牆] CH${i+1} 已成功派件：${cam.name}`);
}

/**
 * 一鍵清空四宮格電視牆
 */
function clearAllWallSlots() {
    console.log("[電視牆] 清空所有頻道...");
    for (let i = 0; i < 4; i++) {
        if (wallRefreshIntervals[i]) {
            clearInterval(wallRefreshIntervals[i]);
            wallRefreshIntervals[i] = null;
        }
        const cell = document.getElementById(`slot-${i}`);
        if (cell) {
            cell.innerHTML = `
                <span class="placeholder">NO SIGNAL</span>
            `;
        }
    }
    manualSlotIndex = 0;
}

/**
 * HTML5 拖曳起始設定
 */
function handleDragStart(event, cam) {
    event.dataTransfer.setData("application/json", JSON.stringify(cam));
    event.dataTransfer.effectAllowed = "copyMove";
    
    // 備援機制：防止部分瀏覽器阻擋 dataTransfer，直接存於全域
    window.currentDraggedCam = cam;
    console.log(`[滑鼠拖曳] 已擷取監視訊號：${cam.name}`);
}

/**
 * 初始化電視牆拖曳控制監聽
 */
function setupWallDragAndDrop() {
    console.log("[電視牆] 初始化 HTML5 Drag & Drop...");

    for (let i = 0; i < 4; i++) {
        const cell = document.getElementById(`slot-${i}`);
        if (!cell) continue;

        cell.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        });

        cell.addEventListener("drop", (event) => {
            event.preventDefault();
            let cam = null;

            try {
                const json = event.dataTransfer.getData("application/json");
                if (json) cam = JSON.parse(json);
            } catch (err) {
                console.warn("[拖曳] JSON 解碼失敗，啟用備援暫存。");
            }

            if (!cam) cam = window.currentDraggedCam;

            if (cam) {
                console.log(`[拖曳成功] ${cam.name} → CH${i + 1}`);
                setWallSlot(i, cam);
            } else {
                console.warn("[拖曳失敗] 無法獲取 CCTV 資訊");
            }
        });
    }
}

// 綁定全域，確保 HTML5 事件與跨檔案調用順暢
window.addCamToWallManually = addCamToWallManually;
window.clearAllWallSlots = clearAllWallSlots;
window.handleDragStart = handleDragStart;
window.setupWallDragAndDrop = setupWallDragAndDrop;
window.setWallSlot = setWallSlot;