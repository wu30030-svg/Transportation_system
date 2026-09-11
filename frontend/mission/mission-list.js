function renderMissionList(missions) {

    const list = document.getElementById("mission-list");

    if (!missions || missions.length === 0) {

        list.innerHTML = `
            <div class="mission-list-empty">
                目前沒有任務
            </div>
        `;

        return;
    }


    list.innerHTML = "";

    missions.forEach(mission => {

        const item = document.createElement("button");

        item.type = "button";

        item.className = "mission-list-item";

        if (currentMission && currentMission.id === mission.id) {

            item.classList.add("active");

        }

        item.innerHTML = `

            <div class="mission-item-top">

                <span class="mission-item-status ${mission.status.toLowerCase()}">
                    ${getMissionStatusText(mission.status)}
                </span>

                <span class="mission-item-code mono">
                    ${shortMissionId(mission.id)}
                </span>

            </div>

            <strong class="mission-item-name">
                ${mission.mission_name || "未命名任務"}
            </strong>

            <span class="mission-item-time mono">
                ${formatMissionDate(mission.start_time)}
            </span>

        `;


        item.addEventListener("click", () => selectMission(mission.id));

        list.appendChild(item);

    });

}

async function loadMissions() {

    const list = document.getElementById("mission-list");

    list.innerHTML = `
        <div class="mission-list-empty">
            載入任務中...
        </div>
    `;

    try {

        const response = await getMissions();

        renderMissionList(response.data || []);

    } catch (error) {

        console.error("Mission Load Error:", error);

        list.innerHTML = `
            <div class="mission-list-error">
                任務資料載入失敗
            </div>
        `;

    }

}

function refreshMissionListActiveState() {

    document.querySelectorAll(".mission-list-item").forEach(item => {

        item.classList.remove("active");

    });

    if (!currentMission) {
        return;
    }

    document.querySelectorAll(".mission-list-item").forEach(item => {

        if (item.querySelector(".mission-item-code")?.textContent.trim() === shortMissionId(currentMission.id)) {

            item.classList.add("active");

        }

    });

}

// ========================================
// Create Mission Modal
// ========================================

function openCreateMissionModal() {

    const overlay =
        document.getElementById(
            "create-mission-modal-overlay"
        );

    if (!overlay) {
        console.warn(
            "Create Mission Modal not found."
        );
        return;
    }

    overlay.classList.add("active");

}


function closeCreateMissionModal() {

    const overlay =
        document.getElementById(
            "create-mission-modal-overlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");

}

// ========================================
// Edit Mission Modal
// ========================================

function openEditMissionModal() {
    const overlay =
        document.getElementById(
            "edit-mission-modal-overlay"
        );

    if (!overlay) {
        console.warn(
            "Edit Mission Modal not found."
        );
        return;
    }

    if (!currentMission) {
        alert("目前沒有選擇任務。");
        return;
    }

    // 填入目前 Mission 資料
    document.getElementById(
        "edit-mission-name"
    ).value =
        currentMission.mission_name || "";

    document.getElementById(
        "edit-mission-description"
    ).value =
        currentMission.description || "";

    document.getElementById(
        "edit-mission-purpose"
    ).value =
        currentMission.purpose || "";

    document.getElementById(
        "edit-mission-start-time"
    ).value =
        formatDateTimeLocal(
            currentMission.start_time
        );

    overlay.classList.add("active");
}

function formatDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function closeEditMissionModal() {
    const overlay =
        document.getElementById(
            "edit-mission-modal-overlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");
}

// ========================================
// Start Planning Modal
// ========================================

function openStartPlanningModal() {
    const overlay =
        document.getElementById(
            "start-planning-modal-overlay"
        );

    if (!overlay) {
        console.warn(
            "Start Planning Modal not found."
        );
        return;
    }

    if (!currentMission) {
        alert("目前沒有選擇任務。");
        return;
    }

    if (currentMission.status !== "DRAFT") {
        alert("只有草稿任務可以開始規劃。");
        return;
    }

    const missionName =
        document.getElementById(
            "start-planning-mission-name"
        );

    if (missionName) {
        missionName.textContent =
            currentMission.mission_name ||
            "未命名任務";
    }

    overlay.classList.add("active");
}


function closeStartPlanningModal() {
    const overlay =
        document.getElementById(
            "start-planning-modal-overlay"
        );

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");
}

// ========================================
// Start Planning
// ========================================

async function handleStartPlanning() {

    if (!currentMission) {
        alert("目前沒有選擇任務。");
        return;
    }

    if (currentMission.status !== "DRAFT") {
        alert("只有草稿任務可以開始規劃。");
        return;
    }

    try {

        const response =
            await updateMissionStatus(
                currentMission.id,
                "PLANNED"
            );

        console.log(
            "[Mission] 開始規劃成功:",
            response
        );

        closeStartPlanningModal();

        // 重新載入目前 Mission
        await selectMission(
            currentMission.id
        );

        // 更新左側 Mission List
        await loadMissions();

        refreshMissionListActiveState();

    } catch (error) {

        console.error(
            "[Mission] 開始規劃失敗:",
            error
        );

        alert(
            "開始規劃失敗：" +
            error.message
        );
    }
}

// ========================================
// Save Edited Mission
// ========================================

async function handleEditMission() {

    if (!currentMission) {
        alert("目前沒有選擇任務。");
        return;
    }

    const missionName =
        document
            .getElementById("edit-mission-name")
            ?.value
            .trim();

    const description =
        document
            .getElementById("edit-mission-description")
            ?.value
            .trim();

    const purpose =
        document
            .getElementById("edit-mission-purpose")
            ?.value
            .trim();

    const startTime =
        document
            .getElementById("edit-mission-start-time")
            ?.value;

    if (!missionName) {
        alert("請輸入任務名稱。");
        return;
    }

    if (!description) {
        alert("請輸入任務說明。");
        return;
    }

    if (!purpose) {
        alert("請輸入任務目的。");
        return;
    }

    if (!startTime) {
        alert("請選擇任務開始時間。");
        return;
    }

    try {

        const response =
            await updateMission(
                currentMission.id,
                {
                    missionName,
                    description,
                    purpose,
                    startTime
                }
            );

        console.log(
            "[Mission] 修改成功:",
            response
        );

        closeEditMissionModal();

        // 重新載入目前 Mission
        await selectMission(
            currentMission.id
        );

        // 更新左側 Mission List
        await loadMissions();

        refreshMissionListActiveState();

    } catch (error) {

        console.error(
            "[Mission] 修改失敗:",
            error
        );

        alert(
            "修改任務失敗：" +
            error.message
        );
    }
}

// ========================================
// Create Mission
// ========================================

async function handleCreateMission() {

    const missionName =
        document
            .getElementById("create-mission-name")
            ?.value
            .trim();

    const description =
        document
            .getElementById("create-mission-description")
            ?.value
            .trim();

    const purpose =
        document
            .getElementById("create-mission-purpose")
            ?.value
            .trim();

    const startTime =
        document
            .getElementById("create-mission-start-time")
            ?.value;


    // ========================================
    // Basic Validation
    // ========================================

    if (!missionName) {

        alert("請輸入任務名稱。");

        return;
    }

    if (!description) {

        alert("請輸入任務說明。");

        return;
    }

    if (!purpose) {

        alert("請輸入任務目的。");

        return;
    }

    if (!startTime) {

        alert("請選擇任務開始時間。");

        return;
    }


    // ========================================
    // Create Mission
    // ========================================

    try {

        const response =
            await createMission({

                missionName,
                description,
                purpose,
                startTime

            });


        console.log(
            "[Mission] 建立成功:",
            response
        );


        const mission =
            response?.data;


        if (!mission) {

            throw new Error(
                "建立任務成功，但沒有取得 Mission 資料。"
            );

        }


        // ========================================
        // 關閉 Modal
        // ========================================

        closeCreateMissionModal();


        // ========================================
        // 清空表單
        // ========================================

        document
            .getElementById("create-mission-name")
            .value = "";

        document
            .getElementById("create-mission-description")
            .value = "";

        document
            .getElementById("create-mission-purpose")
            .value = "";

        document
            .getElementById("create-mission-start-time")
            .value = "";


        // ========================================
        // 重新載入 Mission List
        // ========================================

        await loadMissions();


        // ========================================
        // 自動選取新建立的 Mission
        // ========================================

        if (
            mission.id &&
            typeof selectMission === "function"
        ) {

            await selectMission(
                mission.id
            );

        }

    } catch (error) {

        console.error(
            "[Mission] 建立失敗:",
            error
        );

        alert(
            "建立任務失敗：" +
            error.message
        );

    }

}


// ========================================
// Create Mission Button
// ========================================

document
    .getElementById("createMissionBtn")
    ?.addEventListener(
        "click",
        openCreateMissionModal
    );


// ========================================
// Confirm Create Mission Button
// ========================================

document
    .getElementById("create-mission-confirm-btn")
    ?.addEventListener(
        "click",
        handleCreateMission
    );

// ========================================
// Edit Mission Button
// ========================================

document
    .getElementById("editMissionBtn")
    ?.addEventListener(
        "click",
        openEditMissionModal
    );

// ========================================
// Confirm Edit Mission Button
// ========================================

document
    .getElementById("edit-mission-confirm-btn")
    ?.addEventListener(
        "click",
        handleEditMission
    );

// ========================================
// Start Planning Button
// ========================================

document
    .getElementById("startPlanningBtn")
    ?.addEventListener(
        "click",
        openStartPlanningModal
    );
    
// ========================================
// Confirm Start Planning Button
// ========================================

document
    .getElementById("start-planning-confirm-btn")
    ?.addEventListener(
        "click",
        handleStartPlanning
    );