// ========================================
// Mission API
// ========================================

const MISSION_API_BASE = `${CONFIG.API_BASE_URL}/api/missions`;


// ========================================
// Internal Request Helper
// ========================================

async function missionApiRequest(url, options = {}) {

    const token =
        typeof getAuthToken === "function"
            ? getAuthToken()
            : null;


    const headers = {

        "Content-Type":
            "application/json; charset=utf-8",

        ...(options.headers || {})

    };


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Mission API request failed"
        );

    }


    return data;
}


// ========================================
// Mission
// ========================================

async function getMissions() {

    return await missionApiRequest(
        MISSION_API_BASE
    );

}


async function getMission(missionId) {

    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}`
    );

}


async function createMission(data) {

    return await missionApiRequest(
        MISSION_API_BASE,
        {
            method: "POST",
            body: JSON.stringify(data)
        }
    );

}


async function updateMission(
    missionId,
    data
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}`,

        {
            method: "PATCH",
            body: JSON.stringify(data)
        }

    );

}


async function updateMissionStatus(
    missionId,
    status
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/status`,

        {
            method: "PATCH",

            body: JSON.stringify({
                status
            })

        }

    );

}

// ========================================
// Mission Run
// ========================================

async function startMissionRun(
    missionId
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/run`,

        {
            method: "POST"
        }

    );

}


async function getMissionRuns(
    missionId
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/runs`

    );

}


async function completeMissionRun(
    missionId,
    missionRunId
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/runs/${missionRunId}/complete`,

        {
            method: "POST"
        }

    );

}


async function abortMissionRun(
    missionId,
    missionRunId
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/runs/${missionRunId}/abort`,

        {
            method: "POST"
        }

    );

}

// ========================================
// Mission Route
// ========================================

async function getMissionRoute(
    missionId
) {

    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/route`
    );

}


async function createMissionRoute(
    missionId,
    data
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/route`,

        {
            method: "POST",
            body: JSON.stringify(data)
        }

    );

}


async function updateMissionRoute(
    missionId,
    data
) {

    return await missionApiRequest(

        `${MISSION_API_BASE}/${missionId}/route`,

        {
            method: "PATCH",
            body: JSON.stringify(data)
        }

    );

}


// ========================================
// Mission Vehicle Assignments
// ========================================

const MISSION_VEHICLE_ASSIGNMENT_API = `${CONFIG.API_BASE_URL}/api/mission-vehicle-assignments`;

async function getMissionVehicleAssignments(
    missionId
) {

    return await missionApiRequest(

        `${MISSION_VEHICLE_ASSIGNMENT_API}/mission/${missionId}`

    );

}


async function createMissionVehicleAssignment(
    data
) {

    return await missionApiRequest(

        MISSION_VEHICLE_ASSIGNMENT_API,

        {
            method: "POST",
            body: JSON.stringify(data)
        }

    );

}

// ========================================
// Mission Monitoring
// ========================================

async function getMissionMonitorings(
    missionId
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring`
    );
}

async function createMissionMonitoring(
    missionId,
    cameraId
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring`,
        {
            method: "POST",
            body: JSON.stringify({
                cameraId
            })
        }
    );
}

async function deleteMissionMonitoring(
    missionId,
    monitoringId
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring/${monitoringId}`,
        {
            method: "DELETE"
        }
    );
}

async function pinMissionMonitoring(
    missionId,
    monitoringId
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring/${monitoringId}/pin`,
        {
            method: "PATCH",
            body: JSON.stringify({})
        }
    );
}

async function unpinMissionMonitoring(
    missionId,
    monitoringId
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring/${monitoringId}/unpin`,
        {
            method: "PATCH",
            body: JSON.stringify({})
        }
    );
}

async function swapMissionMonitoring(
    missionId,
    monitoringIdA,
    monitoringIdB
) {
    return await missionApiRequest(
        `${MISSION_API_BASE}/${missionId}/monitoring/reorder`,
        {
            method: "PATCH",
            body: JSON.stringify({
                monitoringIdA,
                monitoringIdB
            })
        }
    );
}

// ========================================
// Vehicle / Personnel
// ========================================

const VEHICLE_API =
    `${CONFIG.API_BASE_URL}/api/vehicles`;

const PERSONNEL_API =
    `${CONFIG.API_BASE_URL}/api/personnel`;


async function getVehicles() {

    return await missionApiRequest(
        VEHICLE_API
    );

}


async function getPersonnel() {

    return await missionApiRequest(
        PERSONNEL_API
    );

}

async function updateMissionVehicleAssignment(
    assignmentId,
    data
) {

    return await missionApiRequest(

        `${MISSION_VEHICLE_ASSIGNMENT_API}/${assignmentId}`,

        {
            method: "PATCH",
            body: JSON.stringify(data)
        }

    );

}


async function deleteMissionVehicleAssignment(
    assignmentId
) {

    return await missionApiRequest(

        `${MISSION_VEHICLE_ASSIGNMENT_API}/${assignmentId}`,

        {
            method: "DELETE"
        }

    );

}
