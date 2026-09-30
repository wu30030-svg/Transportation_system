window.ShuttleMonitorTracking = (() => {

    let refreshTimer = null;

    let locationApi = null;
    let refreshInterval = 5000;

    let onLocations = null;

    function configure({
        api,
        interval = 5000,
        locationsHandler
    }) {
        locationApi = api;
        refreshInterval = interval;
        onLocations = locationsHandler;

        console.log(
            "[Shuttle Monitor Tracking] Tracking 模組設定完成"
        );
    }

    async function refresh() {

        if (!locationApi) {

            console.error(
                "[Shuttle Monitor Tracking] Location API 未設定"
            );

            return;
        }

        const token = getAuthToken();

        if (!token) {

            console.error(
                "[Shuttle Monitor Tracking] 沒有登入 Token"
            );

            return;
        }

        try {

            const response = await fetch(
                locationApi,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (response.status === 401) {

                console.warn(
                    "[Shuttle Monitor Tracking] Token 已失效"
                );

                if (
                    typeof handleUnauthorized ===
                    "function"
                ) {

                    handleUnauthorized();

                }

                return;
            }

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "無法取得接駁車位置"
                );
            }

            const locations =
                Array.isArray(data.data)
                    ? data.data
                    : [];

            console.log(
                `[Shuttle Monitor Tracking] 收到 ${locations.length} 筆定位資料`
            );

            if (
                typeof onLocations ===
                "function"
            ) {

                onLocations(locations);

            }

        } catch (error) {

            console.error(
                "[Shuttle Monitor Tracking] 取得定位失敗:",
                error
            );
        }
    }

    function start() {

        stop();

        refresh();

        refreshTimer =
            setInterval(
                refresh,
                refreshInterval
            );

        console.log(
            "[Shuttle Monitor Tracking] Tracking 定時刷新啟動"
        );
    }

    function stop() {

        if (!refreshTimer) {
            return;
        }

        clearInterval(refreshTimer);

        refreshTimer = null;

        console.log(
            "[Shuttle Monitor Tracking] Tracking 定時刷新停止"
        );
    }

    function cleanup() {

        stop();

        locationApi = null;
        onLocations = null;

        console.log(
            "[Shuttle Monitor Tracking] Tracking 模組已清理"
        );
    }

    return {
        configure,
        refresh,
        start,
        stop,
        cleanup
    };

})();