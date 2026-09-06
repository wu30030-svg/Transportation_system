// ========================================
// Mission API
// ========================================

const MISSION_API_BASE = `${CONFIG.API_BASE_URL}/api/missions`;


// ========================================
// Internal Request Helper
// ========================================

async function missionApiRequest(url, options = {}) {

    const response = await fetch(url, {

        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...(options.headers || {})
        },

        ...options

    });


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
