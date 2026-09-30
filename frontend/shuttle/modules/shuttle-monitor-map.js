window.ShuttleMonitorMap = (() => {

    let shuttleMap = null;

    const shuttleMarkers = new Map();

    let displayMode = "all";

    // ========================================
    // Map Initialization
    // ========================================

    async function init() {

        if (shuttleMap) {
            return;
        }

        if (!window.google || !google.maps) {

            console.error(
                "[Shuttle Monitor Map] Google Maps 尚未載入"
            );

            return;
        }

        await google.maps.importLibrary("marker");

        const targetLocation = {
            lat: 24.239268,
            lng: 120.623498
        };

        shuttleMap = new google.maps.Map(
            document.getElementById("shuttleMap"),
            {
                center: targetLocation,
                zoom: 14,
                mapId: "4226f603895ec596617ae2e5",
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                gestureHandling: "greedy"
            }
        );

        console.log(
            "[Shuttle Monitor Map] Google Maps 初始化完成"
        );
    }


    // ========================================
    // Render A Route
    // ========================================

    function renderLocations(locations) {

        if (!shuttleMap) {
            return;
        }

        const currentIds =
            new Set();

        locations.forEach(location => {

            const personnelNumber =
                location.personnel_number;

            if (
                typeof personnelNumber !==
                "string"
            ) {
                return;
            }

            if (
                typeof location.latitude !==
                "number" ||
                typeof location.longitude !==
                "number"
            ) {
                return;
            }

            // ========================================
            // Map Display Filter
            // ========================================

            if (
                displayMode === "online" &&
                location.gps_status !== "ONLINE"
            ) {
                return;
            }

            currentIds.add(
                personnelNumber
            );

            updateMarker(
                personnelNumber,
                location.latitude,
                location.longitude
            );
        });


        // ========================================
        // Remove Hidden / Missing Markers
        // ========================================

        shuttleMarkers.forEach(
            (
                marker,
                personnelNumber
            ) => {

                if (
                    !currentIds.has(
                        personnelNumber
                    )
                ) {

                    marker.map = null;

                    shuttleMarkers.delete(
                        personnelNumber
                    );
                }
            }
        );
    }


    // ========================================
    // Create / Update Marker
    // ========================================

    function updateMarker(
        personnelNumber,
        latitude,
        longitude
    ) {

        const position = {
            lat: latitude,
            lng: longitude
        };

        let marker =
            shuttleMarkers.get(
                personnelNumber
            );

        if (!marker) {

            marker =
                createMarker(
                    personnelNumber,
                    position
                );

            shuttleMarkers.set(
                personnelNumber,
                marker
            );

            return;
        }

        marker.position =
            position;
    }


    // ========================================
    // Create Shuttle Marker
    // ========================================

    function createMarker(
        personnelNumber,
        position
    ) {

        const markerElement =
            document.createElement(
                "div"
            );

        markerElement.className =
            "shuttle-marker";


        const dot =
            document.createElement(
                "span"
            );

        dot.className =
            "shuttle-dot";


        const label =
            document.createElement(
                "span"
            );

        label.className =
            "shuttle-label";


        label.textContent =
            personnelNumber;


        markerElement.appendChild(
            dot
        );

        markerElement.appendChild(
            label
        );


        const marker =
            new google.maps.marker.AdvancedMarkerElement({
                map: shuttleMap,
                position,
                content: markerElement,
                title: personnelNumber
            });

        return marker;
    }


    // ========================================
    // Display Mode
    // ========================================

    function setDisplayMode(mode) {

        if (
            mode !== "all" &&
            mode !== "online"
        ) {
            return;
        }

        displayMode =
            mode;
    }


    function getDisplayMode() {

        return displayMode;
    }


    // ========================================
    // Cleanup
    // ========================================

    function cleanup() {

        shuttleMarkers.forEach(
            marker => {
                marker.map = null;
            }
        );

        shuttleMarkers.clear();

        shuttleMap = null;
    }


    return {
        init,
        renderLocations,
        setDisplayMode,
        getDisplayMode,
        cleanup
    };

})();