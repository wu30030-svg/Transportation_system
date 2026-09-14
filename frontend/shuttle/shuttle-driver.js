console.log("[Shuttle Driver] Driver UI 啟動");

const lastUpdateElement = document.getElementById("lastUpdate");
const accuracyElement = document.getElementById("accuracy");

const SHUTTLE_LOCATION_API =
    `${CONFIG.API_BASE_URL}/api/tracking/shuttle/location`;

let gpsWatchId = null;

function updateTime() {
    const now = new Date();

    lastUpdateElement.textContent =
        now.toLocaleTimeString("zh-TW", {
            hour12: false
        });
}

async function sendLocationToBackend(position) {
    const token = getAuthToken();

    if (!token) {
        console.error("[Shuttle GPS] 沒有登入 Token");
        accuracyElement.textContent = "未登入";
        return;
    }

    const coords = position.coords;

    const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading,
        recordedAt: new Date().toISOString()
    };

    console.log("[Shuttle GPS] 準備送出", payload);

    try {
        const response = await fetch(
            SHUTTLE_LOCATION_API,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json; charset=utf-8",
                    "Authorization":
                        `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "GPS 上傳失敗"
            );
        }

        console.log(
            "[Shuttle GPS] 上傳成功",
            data
        );

        accuracyElement.textContent =
            `±${Math.round(coords.accuracy)} m`;

        updateTime();

    } catch (error) {
        console.error(
            "[Shuttle GPS] 上傳失敗",
            error
        );

        accuracyElement.textContent =
            "傳送失敗";
    }
}

function updateGPS(position) {

    const coords = position.coords;

    console.log("[GPS]", {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading
    });

    // 先更新畫面
    accuracyElement.textContent =
        `±${Math.round(coords.accuracy)} m`;

    updateTime();

    // 再送到 Backend
    sendLocationToBackend(position);
}

function handleGPSError(error) {

    console.error(
        "[GPS] 定位失敗",
        error
    );

    accuracyElement.textContent =
        "定位失敗";

    lastUpdateElement.textContent =
        "--:--:--";
}

function startGPS() {

    if (!navigator.geolocation) {

        console.error(
            "[GPS] 此裝置不支援 Geolocation"
        );

        accuracyElement.textContent =
            "不支援 GPS";

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

startGPS();

