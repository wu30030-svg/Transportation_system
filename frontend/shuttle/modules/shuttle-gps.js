// ============================================================
// Shuttle GPS Module
// 接駁車 GPS 定位與上傳
// ============================================================

window.ShuttleGPS = (() => {

    let gpsWatchId = null;

    let lastUpdateElement = null;
    let accuracyElement = null;

    let statusHandler = null;

    let lastGpsAt = null;
    let lastUploadSuccessAt = null;

    let statusTimer = null;

    let isGpsAvailable = false;
    let isUploading = false;

    // ========================================================
    // GPS Upload Status Threshold
    // ========================================================

    const GPS_WARNING_SECONDS = 15;
    const GPS_OFFLINE_SECONDS = 30;


    // ========================================================
    // GPS Accuracy Threshold
    // ========================================================

    // <= 100m
    // 正常

    const GPS_ACCURACY_NORMAL_METERS = 100;


    // 101m ~ 500m
    // 精度偏低

    const GPS_ACCURACY_WARNING_METERS = 500;


    // > 500m
    // 精度很差


    const SHUTTLE_LOCATION_API =
        `${CONFIG.API_BASE_URL}/api/tracking/shuttle/location`;


    // ========================================================
    // Current GPS Accuracy
    // ========================================================

    let currentAccuracy = null;

    let currentAccuracyStatus = "UNKNOWN";


    // ========================================================
    // Init
    // ========================================================

    function init({
        lastUpdateElement: lastUpdate,
        accuracyElement: accuracy,
        statusHandler: status
    }) {

        lastUpdateElement = lastUpdate;
        accuracyElement = accuracy;
        statusHandler = status;

        startStatusMonitor();
    }


    // ========================================================
    // GPS Accuracy Status
    // ========================================================

    function getAccuracyStatus(accuracy) {

        if (!Number.isFinite(accuracy)) {
            return "UNKNOWN";
        }


        // ====================================================
        // 正常
        // ====================================================

        if (
            accuracy <=
            GPS_ACCURACY_NORMAL_METERS
        ) {

            return "NORMAL";
        }


        // ====================================================
        // 精度偏低
        // ====================================================

        if (
            accuracy <=
            GPS_ACCURACY_WARNING_METERS
        ) {

            return "WARNING";
        }


        // ====================================================
        // 精度很差
        // ====================================================

        return "POOR";
    }


    // ========================================================
    // Update GPS Accuracy UI
    // ========================================================

    function updateAccuracyUI() {

        if (!accuracyElement) {
            return;
        }


        if (!Number.isFinite(currentAccuracy)) {

            accuracyElement.textContent =
                "—";

            accuracyElement.title =
                "";

            return;
        }


        const roundedAccuracy =
            Math.round(currentAccuracy);


        // ====================================================
        // 正常
        // ====================================================

        if (
            currentAccuracyStatus ===
            "NORMAL"
        ) {

            accuracyElement.textContent =
                `±${roundedAccuracy}m`;

            accuracyElement.title =
                "GPS 定位精度正常";

            return;
        }


        // ====================================================
        // 精度偏低
        // ====================================================

        if (
            currentAccuracyStatus ===
            "WARNING"
        ) {

            accuracyElement.textContent =
                `🟡 ±${roundedAccuracy}m`;

            accuracyElement.title =
                "定位精度偏低，仍可繼續傳送定位資料";

            return;
        }


        // ====================================================
        // 精度很差
        // ====================================================

        if (
            currentAccuracyStatus ===
            "POOR"
        ) {

            accuracyElement.textContent =
                `🔴 ±${roundedAccuracy}m`;

            accuracyElement.title =
                "定位精度很差，請確認手機定位功能，並移至較開闊位置";

            return;
        }


        // ====================================================
        // 未知
        // ====================================================

        accuracyElement.textContent =
            `±${roundedAccuracy}m`;

        accuracyElement.title =
            "";
    }


    // ========================================================
    // Status
    // ========================================================

    function notifyStatus(
        status,
        detail = {}
    ) {

        if (
            typeof statusHandler !==
            "function"
        ) {

            return;
        }


        statusHandler({

            status,

            lastGpsAt,

            lastUploadSuccessAt,

            accuracy:
                currentAccuracy,

            accuracyStatus:
                currentAccuracyStatus,

            ...detail

        });
    }


    // ========================================================
    // Seconds Since Last Upload
    // ========================================================

    function getSecondsSinceLastUpload() {

        if (!lastUploadSuccessAt) {
            return null;
        }

        return Math.floor(
            (Date.now() - lastUploadSuccessAt) /
            1000
        );
    }


    // ========================================================
    // Status Monitor
    // ========================================================

    function updateStatus() {

        const secondsSinceUpload =
            getSecondsSinceLastUpload();


        // ================================================
        // 尚未成功取得 GPS
        // ================================================

        if (!isGpsAvailable) {

            notifyStatus(
                "GPS_UNAVAILABLE"
            );

            return;
        }


        // ================================================
        // 尚未成功送出過
        // ================================================

        if (!lastUploadSuccessAt) {

            notifyStatus(
                "WAITING_UPLOAD"
            );

            return;
        }


        // ================================================
        // 30 秒以上沒有成功送達
        // ================================================

        if (
            secondsSinceUpload !== null &&
            secondsSinceUpload >=
            GPS_OFFLINE_SECONDS
        ) {

            notifyStatus(
                "OFFLINE",
                {
                    secondsSinceUpload
                }
            );

            return;
        }


        // ================================================
        // 15 秒以上沒有成功送達
        // ================================================

        if (
            secondsSinceUpload !== null &&
            secondsSinceUpload >=
            GPS_WARNING_SECONDS
        ) {

            notifyStatus(
                "DELAYED",
                {
                    secondsSinceUpload
                }
            );

            return;
        }


        // ================================================
        // 最近成功送達
        // ================================================

        notifyStatus(
            "ONLINE",
            {
                secondsSinceUpload
            }
        );
    }


    function startStatusMonitor() {

        if (statusTimer) {

            clearInterval(
                statusTimer
            );
        }


        statusTimer =
            setInterval(
                updateStatus,
                1000
            );


        updateStatus();
    }


    // ========================================================
    // Time
    // ========================================================

    function updateTime() {

        if (!lastUpdateElement) {
            return;
        }


        lastUpdateElement.textContent =
            new Date().toLocaleTimeString(
                "zh-TW",
                {
                    hour12: false
                }
            );
    }


    // ========================================================
    // Upload
    // ========================================================

    async function sendLocationToBackend(
        latitude,
        longitude,
        accuracy,
        speed,
        heading
    ) {

        console.log(
            "[Shuttle GPS] 準備送出",
            {
                latitude,
                longitude,
                accuracy,
                speed,
                heading
            }
        );


        isUploading = true;


        try {

            const response =
                await fetch(
                    SHUTTLE_LOCATION_API,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${getAuthToken()}`
                        },

                        body:
                            JSON.stringify({

                                latitude,
                                longitude,
                                accuracy,
                                speed,
                                heading,

                                recordedAt:
                                    new Date().toISOString()
                            })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "GPS 上傳失敗"
                );
            }


            // ==================================================
            // Backend 已成功收到並處理
            // ==================================================

            lastUploadSuccessAt =
                Date.now();


            updateTime();


            console.log(
                "[Shuttle GPS] 上傳成功",
                result
            );


            notifyStatus(
                "ONLINE",
                {
                    secondsSinceUpload: 0,

                    uploadSuccess:
                        true,

                    response:
                        result
                }
            );


            return true;

        } catch (error) {

            console.error(
                "[Shuttle GPS] 上傳失敗:",
                error
            );


            notifyStatus(
                "UPLOAD_ERROR",
                {
                    error
                }
            );


            return false;

        } finally {

            isUploading = false;
        }
    }


    // ========================================================
    // GPS Position
    // ========================================================

    function updateGPS(position) {

        const latitude =
            position.coords.latitude;

        const longitude =
            position.coords.longitude;

        const accuracy =
            position.coords.accuracy;

        const speed =
            position.coords.speed;

        const heading =
            position.coords.heading;


        // ====================================================
        // 更新 GPS 基本狀態
        // ====================================================

        lastGpsAt =
            Date.now();


        isGpsAvailable =
            true;


        // ====================================================
        // 更新 GPS 精度
        // ====================================================

        currentAccuracy =
            Number.isFinite(accuracy)
                ? accuracy
                : null;


        currentAccuracyStatus =
            getAccuracyStatus(
                currentAccuracy
            );


        // ====================================================
        // Console
        // ====================================================

        console.log(
            "[GPS]",
            {
                latitude,
                longitude,
                accuracy,
                accuracyStatus:
                    currentAccuracyStatus,
                speed,
                heading
            }
        );


        // ====================================================
        // 更新駕駛端精度顯示
        // ====================================================

        updateAccuracyUI();


        // ====================================================
        // GPS 精度警告
        // ====================================================

        if (
            currentAccuracyStatus ===
            "WARNING"
        ) {

            console.warn(
                "[GPS] 定位精度偏低:",
                `${Math.round(currentAccuracy)}m`
            );
        }


        if (
            currentAccuracyStatus ===
            "POOR"
        ) {

            console.warn(
                "[GPS] 定位精度很差:",
                `${Math.round(currentAccuracy)}m`
            );
        }


        // ====================================================
        // GPS 有取得
        // 但還沒知道這次 POST 是否成功
        // ====================================================

        notifyStatus(
            "GPS_RECEIVED"
        );


        // ====================================================
        // 繼續送出 GPS
        //
        // 注意：
        // 精度差不代表停止上傳
        // ====================================================

        sendLocationToBackend(
            latitude,
            longitude,
            accuracy,
            speed,
            heading
        );
    }


    // ========================================================
    // GPS Error
    // ========================================================

    function handleGPSError(error) {

        console.error(
            "[GPS] 定位錯誤:",
            error
        );


        isGpsAvailable =
            false;


        currentAccuracy =
            null;


        currentAccuracyStatus =
            "UNKNOWN";


        updateAccuracyUI();


        notifyStatus(
            "GPS_ERROR",
            {
                error
            }
        );
    }


    // ========================================================
    // Start
    // ========================================================

    function start() {

        if (!navigator.geolocation) {

            console.error(
                "[GPS] 瀏覽器不支援 Geolocation"
            );


            isGpsAvailable =
                false;


            notifyStatus(
                "GPS_UNAVAILABLE"
            );


            return;
        }


        if (gpsWatchId !== null) {

            console.warn(
                "[GPS] GPS Watch 已經啟動"
            );

            return;
        }


        console.log(
            "[GPS] 開始取得定位"
        );


        notifyStatus(
            "STARTING"
        );


        gpsWatchId =
            navigator.geolocation.watchPosition(
                updateGPS,
                handleGPSError,
                {
                    enableHighAccuracy:
                        true,

                    maximumAge:
                        5000,

                    timeout:
                        10000
                }
            );
    }


    // ========================================================
    // Restart
    // ========================================================

    function restart() {

        console.log(
            "[GPS] 重新啟動 GPS Watch"
        );


        stop();


        // ====================================================
        // 清除舊的 GPS 狀態
        // ====================================================

        isGpsAvailable =
            false;

        lastGpsAt =
            null;

        currentAccuracy =
            null;

        currentAccuracyStatus =
            "UNKNOWN";


        updateAccuracyUI();


        notifyStatus(
            "RESTARTING"
        );


        start();
    }


    // ========================================================
    // Stop
    // ========================================================

    function stop() {

        if (gpsWatchId === null) {
            return;
        }


        navigator.geolocation.clearWatch(
            gpsWatchId
        );


        gpsWatchId =
            null;


        console.log(
            "[GPS] GPS Watch 已停止"
        );
    }


    // ========================================================
    // Visibility Change
    // ========================================================

    function handleVisibilityChange() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            console.log(
                "[GPS] 頁面重新回到前景"
            );


            restart();
        }
    }


    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );


    // ========================================================
    // Public API
    // ========================================================

    return {

        init,

        start,

        stop,

        restart,


        getState: () => ({

            gpsWatchId,

            isGpsAvailable,

            lastGpsAt,

            lastUploadSuccessAt,

            isUploading,

            accuracy:
                currentAccuracy,

            accuracyStatus:
                currentAccuracyStatus
        })
    };

})();