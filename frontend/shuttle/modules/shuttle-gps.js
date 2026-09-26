// ============================================================
// Shuttle GPS Module
// 接駁車 GPS 定位與上傳
// ============================================================

window.ShuttleGPS = (() => {

    let gpsWatchId = null;

    let lastUpdateElement = null;
    let accuracyElement = null;

    const SHUTTLE_LOCATION_API =
        `${CONFIG.API_BASE_URL}/api/tracking/shuttle/location`;


    // ========================================
    // DOM
    // ========================================

    function init({
        lastUpdateElement: lastUpdate,
        accuracyElement: accuracy
    }) {

        lastUpdateElement =
            lastUpdate;

        accuracyElement =
            accuracy;
    }


    // ========================================
    // Time
    // ========================================

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


    // ========================================
    // Backend
    // ========================================

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


            console.log(
                "[Shuttle GPS] 上傳成功",
                result
            );


            updateTime();


        } catch (error) {

            console.error(
                "[Shuttle GPS] 上傳失敗:",
                error
            );
        }
    }


    // ========================================
    // Position
    // ========================================

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


        console.log(
            "[GPS]",
            {
                latitude,
                longitude,
                accuracy,
                speed,
                heading
            }
        );


        if (accuracyElement) {

            accuracyElement.textContent =
                `±${Math.round(accuracy)}m`;
        }


        sendLocationToBackend(
            latitude,
            longitude,
            accuracy,
            speed,
            heading
        );
    }


    // ========================================
    // Error
    // ========================================

    function handleGPSError(error) {

        console.error(
            "[GPS] 定位錯誤:",
            error
        );
    }


    // ========================================
    // Start
    // ========================================

    function start() {

        if (!navigator.geolocation) {

            console.error(
                "[GPS] 瀏覽器不支援 Geolocation"
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


        gpsWatchId =
            navigator.geolocation.watchPosition(
                updateGPS,
                handleGPSError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
                }
            );
    }


    // ========================================
    // Stop
    // ========================================

    function stop() {

        if (gpsWatchId === null) {
            return;
        }


        navigator.geolocation.clearWatch(
            gpsWatchId
        );


        gpsWatchId = null;


        console.log(
            "[GPS] GPS Watch 已停止"
        );
    }


    return {

        init,
        start,
        stop

    };

})();
