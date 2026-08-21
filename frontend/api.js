/**
 * API 呼叫中心
 * 所有與後端溝通都集中在這裡
 */

async function getCameras() {

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/cameras`
    );

    if (!response.ok) {
        throw new Error("取得監視器失敗");
    }

    return await response.json();

}

/**
 * Route API
 * 傳送導航路線給 Backend
 */
async function fetchRouteCameras(decodedPath) {

    const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/routes/cameras`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                decodedPath
            })
        }
    );

    if (!response.ok) {
        throw new Error("Route API 呼叫失敗");
    }

    return await response.json();

}

window.fetchRouteCameras = fetchRouteCameras;