// ========================================
// Mission Tabs
// ========================================
//
// 負責：
// Workspace Tab 的使用者操作
//
// 實際 Workspace 切換：
// mission-workspace.js
// ========================================


function setupWorkspaceTabs() {

    const tabs =
        document.querySelectorAll(".workspace-tab");


    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target =
                tab.dataset.workspace;


            switchWorkspace(target);

        });

    });

}