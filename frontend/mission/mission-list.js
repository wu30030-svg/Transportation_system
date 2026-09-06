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
