// ========================================
// Mission Vehicles Workspace
// ========================================
//
// 負責：
// - 02 車輛 Workspace
// - 顯示任務車輛 Assignment
// - 顯示車輛 / 駕駛 / 車長
// - 顯示主車
// - 開啟車輛配置 Modal
//
// 暫不負責：
// - Vehicle CRUD
// - Personnel CRUD
// - Assignment POST
// ========================================

let editingMissionVehicleAssignmentId = null;

// ========================================
// Get Main Mission Vehicle
// ========================================

function getMainMissionVehicle() {

    const assignments = currentAssignments || [];

    const mainAssignment = assignments.find(
        assignment => assignment.is_main_vehicle === true
    );

    if (!mainAssignment) {
        return null;
    }

    return mainAssignment.vehicle || null;
}

// ========================================
// Mission Vehicle Edit Permission
// ========================================

function canEditMissionVehicles() {

    if (!currentMission) {
        return false;
    }

    return ["DRAFT", "PLANNED"].includes(
        currentMission.status
    );
}

// ========================================
// Render Mission Vehicles
// ========================================

function renderMissionVehicles() {

    const totalCount = document.getElementById("vehicle-total-count");

    const mainStatus = document.getElementById("vehicle-main-status");

    const driverCount = document.getElementById("vehicle-driver-count");

    const commanderCount = document.getElementById("vehicle-commander-count");

    const emptyState = document.getElementById("vehicle-empty-state");

    const assignmentList = document.getElementById("vehicle-assignment-list");

    // ========================================
    // DOM 不存在
    // ========================================

    if (!totalCount || !mainStatus || !driverCount || !commanderCount || !emptyState || !assignmentList) {

        console.warn("Mission Vehicles: required DOM elements not found.");

        return;

    }

    // ========================================
    // Assignments
    // ========================================

    const assignments = currentAssignments || [];

    // ========================================
    // Summary
    // ========================================

    totalCount.textContent = String(assignments.length).padStart(2, "0");

    const mainVehicle = assignments.find(assignment => assignment.is_main_vehicle === true);

    mainStatus.textContent = mainVehicle?.vehicle?.vehicle_number || "未設定";

    driverCount.textContent = String(assignments.filter(assignment => assignment.driver?.id).length).padStart(2, "0");

    commanderCount.textContent = String(assignments.filter(assignment => assignment.commander?.id).length).padStart(2, "0");

    // ========================================
    // Empty / Assignment List
    // ========================================

    if (assignments.length === 0) {

        emptyState.classList.remove("hidden");

        assignmentList.classList.add("hidden");

        assignmentList.innerHTML = "";

    } else {

        emptyState.classList.add("hidden");

        assignmentList.classList.remove("hidden");

        assignmentList.innerHTML = assignments.map(renderMissionVehicleCard).join("");

    }

    // ========================================
    // Bind Buttons
    // ========================================

    bindVehicleConfigureButtons();

}

const confirmButton = document.getElementById("mission-vehicle-confirm-btn");

if (confirmButton) {

    confirmButton.onclick = handleMissionVehicleConfirm;

}

// ========================================
// Vehicle Configure Buttons
// ========================================

function bindVehicleConfigureButtons() {

    const headerButton =
        document.getElementById("add-vehicle-assignment-btn");

    const emptyButton =
        document.getElementById("vehicle-empty-add-btn");

    const canEdit =
        canEditMissionVehicles();


    // ========================================
    // Add Assignment
    // ========================================

    if (headerButton) {

        headerButton.disabled =
            !canEdit;

        headerButton.onclick =
            canEdit
                ? openMissionVehicleModal
                : null;

    }


    if (emptyButton) {

        emptyButton.disabled =
            !canEdit;

        emptyButton.onclick =
            canEdit
                ? openMissionVehicleModal
                : null;

    }


    // ========================================
    // Edit Assignment
    // ========================================

    const editButtons =
        document.querySelectorAll(".vehicle-edit-btn");

    editButtons.forEach(button => {

        button.disabled =
            !canEdit;

        button.onclick = () => {

            if (!canEditMissionVehicles()) {

                return;

            }

            const assignmentId =
                button.dataset.assignmentId;

            const assignment =
                (currentAssignments || []).find(
                    item => item.id === assignmentId
                );

            if (!assignment) {

                console.error(
                    "Mission vehicle assignment not found:",
                    assignmentId
                );

                return;

            }

            openMissionVehicleModal(assignment);

        };

    });


    // ========================================
    // Delete Assignment
    // ========================================

    const deleteButtons =
        document.querySelectorAll(".vehicle-delete-btn");

    deleteButtons.forEach(button => {

        button.disabled =
            !canEdit;

        button.onclick = async () => {

            if (!canEditMissionVehicles()) {

                return;

            }

            const assignmentId =
                button.dataset.assignmentId;

            const assignment =
                (currentAssignments || []).find(
                    item => item.id === assignmentId
                );

            if (!assignment) {

                console.error(
                    "Mission vehicle assignment not found:",
                    assignmentId
                );

                return;

            }

            const vehicleNumber =
                assignment.vehicle?.vehicle_number ||
                "未設定";

            const confirmed =
                confirm(
                    `確定要刪除任務車輛「${vehicleNumber}」的配置嗎？\n\n刪除後該車輛將釋放回可用狀態。`
                );

            if (!confirmed) {

                return;

            }

            try {

                await deleteMissionVehicleAssignment(
                    assignmentId
                );

                console.log(
                    "任務車輛配置刪除成功：",
                    assignmentId
                );

                await loadMissionAssignments(
                    currentMission.id
                );

                renderMission();

                renderMissionVehicles();

            } catch (error) {

                console.error(
                    "任務車輛配置刪除失敗：",
                    error
                );

                alert(
                    "任務車輛配置刪除失敗：" +
                    error.message
                );

            }

        };

    });

}

// ========================================
// Open Vehicle Modal
// ========================================

async function openMissionVehicleModal(assignment = null) {

    if (!canEditMissionVehicles()) {

        alert("目前任務狀態不可修改車輛配置。");

        return;

    }

    editingMissionVehicleAssignmentId = assignment?.id || null;

    const modal = document.getElementById("mission-vehicle-modal-overlay");

    if (!modal) {

        console.warn("mission-vehicle-modal-overlay is not available.");

        return;

    }

    try {

        // ========================================
        // Load Vehicles
        // ========================================

        const vehicleResponse = await getVehicles();

        const vehicles = vehicleResponse.data || [];

        const vehicleSelect = document.getElementById("mission-vehicle-select");

        if (!vehicleSelect) {

            console.warn("mission-vehicle-select is not available.");

            return;

        }

        vehicleSelect.innerHTML = `
            <option value="">
                請選擇車輛
            </option>
        `;

        vehicles.filter(
            vehicle =>
                vehicle.status === "AVAILABLE" ||
                vehicle.id === assignment?.vehicle_id
        ).forEach(
            vehicle => {

                const option = document.createElement("option");

                option.value = vehicle.id;

                option.textContent =
                    `${vehicle.vehicle_number} — ${vehicle.vehicle_type}`;

                vehicleSelect.appendChild(option);

            }
        );

        // ========================================
        // Load Personnel
        // ========================================

        const personnelResponse = await getPersonnel();

        const personnel = personnelResponse.data || [];

        // ========================================
        // Driver
        // ========================================

        const driverSelect = document.getElementById("mission-driver-select");

        if (driverSelect) {

            driverSelect.innerHTML = `
                <option value="">
                    請選擇駕駛
                </option>
            `;

            personnel.filter(
                person => person.status === "ACTIVE").forEach(
                    person => {

                        const option = document.createElement("option");

                        option.value = person.id;

                        option.textContent = `${person.personnel_number} — ${person.name}`;

                        driverSelect.appendChild(option);

                    }
                );

        }

        // ========================================
        // Commander
        // ========================================

        const commanderSelect = document.getElementById("mission-commander-select");

        if (commanderSelect) {

            commanderSelect.innerHTML = `
                <option value="">
                    不配置車長
                </option>
            `;

            personnel.filter(person => person.status === "ACTIVE").forEach(
                person => {

                    const option = document.createElement("option");

                    option.value = person.id;

                    option.textContent = `${person.personnel_number} — ${person.name}`;

                    commanderSelect.appendChild(option);

                }
            );

        }

        // ========================================
        // Edit Mode: Pre-fill Assignment
        // ========================================

        if (assignment) {

            vehicleSelect.value =
                assignment.vehicle_id || "";

            if (driverSelect) {

                driverSelect.value =
                    assignment.driver_id || "";

            }

            if (commanderSelect) {

                commanderSelect.value =
                    assignment.commander_id || "";

            }

            const mainVehicleCheckbox =
                document.getElementById(
                    "mission-main-vehicle-checkbox"
                );

            if (mainVehicleCheckbox) {

                mainVehicleCheckbox.checked =
                    assignment.is_main_vehicle === true;

            }

        }

        // ========================================
        // Open Modal
        // ========================================

        modal.classList.add("active");

    } catch (error) {

        console.error("載入任務車輛配置資料失敗：", error);

    }

}

function closeMissionVehicleModal() {

    const modal = document.getElementById("mission-vehicle-modal-overlay");

    if (!modal) {

        console.warn("mission-vehicle-modal-overlay is not available.");

        return;

    }

    modal.classList.remove("active");

}

// ========================================
// Render Vehicle Card
// ========================================

function renderMissionVehicleCard(assignment) {

    const vehicle = assignment.vehicle || {};

    const driver = assignment.driver || null;

    const commander = assignment.commander || null;

    const isMain = assignment.is_main_vehicle === true;

    return `

        <article
            class="mission-vehicle-card ${isMain ? "main-vehicle" : ""}"
        >

            <div class="vehicle-card-top">

                <div>

                    ${isMain
            ? `
                                <span class="vehicle-main-badge">
                                    ★ 主車
                                </span>
                              `
            : ""
        }

                    <span class="vehicle-card-label">
                        任務車輛
                    </span>

                </div>


                <span class="vehicle-assignment-status">
                    ${assignment.status || "ASSIGNED"}
                </span>

            </div>


            <div class="vehicle-card-identity">

                <strong class="vehicle-number mono">
                    ${vehicle.vehicle_number || "未設定"}
                </strong>

                <span class="vehicle-type">
                    ${formatVehicleType(
            vehicle.vehicle_type
        )}
                </span>

            </div>


            <div class="vehicle-spec-grid">

                <div>

                    <span>
                        高
                    </span>

                    <strong>
                        ${vehicle.vehicle_height ?? "--"} m
                    </strong>

                </div>


                <div>

                    <span>
                        寬
                    </span>

                    <strong>
                        ${vehicle.vehicle_width ?? "--"} m
                    </strong>

                </div>


                <div>

                    <span>
                        重
                    </span>

                    <strong>
                        ${vehicle.vehicle_weight ?? "--"} kg
                    </strong>

                </div>

            </div>


            <div class="vehicle-personnel">

                <div class="vehicle-person">

                    <span class="vehicle-person-label">
                        駕駛
                    </span>

                    <strong>
                        ${driver?.name
        || "未配置"
        }
                    </strong>

                    ${driver?.personnel_number
            ? `
                                <small>
                                    ${driver.personnel_number}
                                </small>
                              `
            : ""
        }

                </div>


                <div class="vehicle-person">

                    <span class="vehicle-person-label">
                        車長
                    </span>

                    <strong>
                        ${commander?.name
        || "未配置"
        }
                    </strong>

                    ${commander?.personnel_number
            ? `
                                <small>
                                    ${commander.personnel_number}
                                </small>
                              `
            : ""
        }

                </div>

            </div>


            <div class="vehicle-card-footer">

                <span>
                    車輛狀態
                </span>

                <strong>
                    ${formatVehicleStatus(
            vehicle.status
        )}
                </strong>
            </div>
            
            <div class="vehicle-card-actions">

                <button
                    type="button"
                    class="vehicle-edit-btn"
                    data-assignment-id="${assignment.id}"
                >
                    編輯配置
                </button>

                <button
                    type="button"
                    class="vehicle-delete-btn"
                    data-assignment-id="${assignment.id}"
                >
                    刪除配置
                </button>

            </div>

        </article>

    `;

}

// ========================================
// Vehicle Type
// ========================================

function formatVehicleType(type) {

    const labels = {

        MILITARY_MEDIUM_TRUCK: "軍用中型卡車"

    };

    return labels[type] || type || "未設定";

}

// ========================================
// Vehicle Status
// ========================================

function formatVehicleStatus(status) {

    const labels = {

        AVAILABLE: "可用",

        ASSIGNED: "已編組",

        MAINTENANCE: "維修中"

    };

    return labels[status] || status || "未知";

}

async function handleMissionVehicleConfirm() {

    const vehicleSelect =
        document.getElementById("mission-vehicle-select");

    const driverSelect =
        document.getElementById("mission-driver-select");

    const commanderSelect =
        document.getElementById("mission-commander-select");

    const mainVehicleCheckbox =
        document.getElementById(
            "mission-main-vehicle-checkbox"
        );

    const vehicleId =
        vehicleSelect?.value || "";

    const driverId =
        driverSelect?.value || "";

    const commanderId =
        commanderSelect?.value || null;

    const isMainVehicle =
        mainVehicleCheckbox?.checked || false;


    // ========================================
    // 基本檢查
    // ========================================

    if (!currentMission) {

        alert("目前沒有選擇任務。");

        return;

    }

    if (!vehicleId) {

        alert("請選擇車輛。");

        return;

    }

    if (!driverId) {

        alert("請選擇駕駛。");

        return;

    }


    // ========================================
    // Assignment Data
    // ========================================

    const assignmentData = {

        missionId: currentMission.id,

        vehicleId: vehicleId,

        driverId: driverId,

        commanderId: commanderId,

        isMainVehicle: isMainVehicle

    };


    try {

        // ========================================
        // Create Assignment
        // ========================================

        let response;

        if (editingMissionVehicleAssignmentId) {

            response =
                await updateMissionVehicleAssignment(
                    editingMissionVehicleAssignmentId,
                    {
                        vehicleId: vehicleId,
                        driverId: driverId,
                        commanderId: commanderId,
                        isMainVehicle: isMainVehicle
                    }
                );

        } else {

            response =
                await createMissionVehicleAssignment(
                    assignmentData
                );

        }

        console.log(editingMissionVehicleAssignmentId ? "任務車輛配置更新成功：" : "任務車輛配置建立成功：", response);

        // ========================================
        // Reload Assignments
        // ========================================

        await loadMissionAssignments(
            currentMission.id
        );


        // ========================================
        // Refresh Mission UI
        // ========================================

        renderMission();

        renderMissionVehicles();


        // ========================================
        // Close Modal
        // ========================================

        closeMissionVehicleModal();

        editingMissionVehicleAssignmentId = null;


    } catch (error) {

        console.error(
            "任務車輛配置建立失敗：",
            error
        );

        alert(
            "任務車輛配置失敗：" +
            error.message
        );

    }

}

const vehiclesNextButton = document.getElementById("vehicles-next-btn");

if (vehiclesNextButton) {
    vehiclesNextButton.addEventListener("click", () => {
        switchWorkspace("route");
    });
}