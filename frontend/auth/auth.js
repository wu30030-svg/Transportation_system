/**
 * ========================================
 * Authentication
 * ========================================
 *
 * 負責：
 * 1. Login
 * 2. JWT Token 保存
 * 3. JWT Token 取得
 * 4. Logout
 * 5. 取得目前登入使用者
 * 6. Workspace Routing
 *
 * 不負責：
 * - Mission
 * - Vehicle
 * - Tracking
 * - Route
 * ========================================
 */


const AUTH_API_BASE =
    `${CONFIG.API_BASE_URL}/api/auth`;


// ========================================
// Shuttle Workspace
// ========================================

const SHUTTLE_ACCESS_CONTEXTS = [

    "營區開放_A路線",

    "營區開放_B路線",

    "營區開放_C路線"

];


// ========================================
// Login
// ========================================

async function login(username, password) {

    const response =
        await fetch(
            `${AUTH_API_BASE}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json; charset=utf-8"
                },

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "登入失敗"
        );

    }


    if (
        !data.data ||
        !data.data.token
    ) {

        throw new Error(
            "登入成功，但沒有取得 Token"
        );

    }


    localStorage.setItem(
        "mission_center_token",
        data.data.token
    );


    localStorage.setItem(
        "mission_center_user",
        JSON.stringify(
            data.data.user
        )
    );


    console.log(
        "[Auth] Login 成功:",
        data.data.user
    );


    return data.data;

}


// ========================================
// Token
// ========================================

function getAuthToken() {

    return localStorage.getItem(
        "mission_center_token"
    );

}


// ========================================
// Current User
// ========================================

function getCurrentUser() {

    const raw =
        localStorage.getItem(
            "mission_center_user"
        );


    if (!raw) {

        return null;

    }


    try {

        return JSON.parse(raw);

    } catch (error) {

        console.warn(
            "[Auth] 無法解析目前使用者:",
            error
        );

        return null;

    }

}


// ========================================
// Get Current User From Backend
// ========================================

async function getCurrentUserFromBackend() {

    const token =
        getAuthToken();


    if (!token) {

        return null;

    }


    const response =
        await fetch(
            `${AUTH_API_BASE}/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    let data = null;

    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        const error =
            new Error(
                data?.message ||
                "無法取得目前登入使用者"
            );

        error.status =
            response.status;

        throw error;

    }


    if (
        !data?.success ||
        !data?.data?.user
    ) {

        throw new Error(
            "登入狀態驗證失敗"
        );

    }


    const user =
        data.data.user;


    // ========================================
    // 更新本機暫存
    // ========================================

    localStorage.setItem(
        "mission_center_user",
        JSON.stringify(user)
    );


    console.log(
        "[Auth] Backend Current User:",
        user
    );


    return user;

}


// ========================================
// Workspace Routing
// ========================================

function routeAuthenticatedUser(user) {

    if (!user) {

        console.warn(
            "[Auth] Workspace Routing: 使用者資料不存在。"
        );

        return false;

    }


    const roleId =
        Number(user.role_id);


    const accessContext =
        user.access_context || null;


    console.log(
        "[Auth] Workspace Routing:",
        {
            username: user.username,
            role_id: roleId,
            access_context: accessContext
        }
    );


    // ========================================
    // Shuttle Monitor
    // ========================================

    if (
        roleId === 6 &&
        SHUTTLE_ACCESS_CONTEXTS.includes(
            accessContext
        )
    ) {

        console.log(
            "[Auth] → Shuttle Monitor:",
            accessContext
        );


        window.location.href =
            "./shuttle/shuttle-monitor.html";


        return true;

    }


    // ========================================
    // Shuttle Driver
    // ========================================

    if (
        roleId === 4 &&
        SHUTTLE_ACCESS_CONTEXTS.includes(
            accessContext
        )
    ) {

        console.log(
            "[Auth] → Shuttle Driver:",
            accessContext
        );


        window.location.href =
            "./shuttle/shuttle-driver.html";


        return true;

    }


    // ========================================
    // Mission Center
    // ========================================

    console.log(
        "[Auth] → Mission Center"
    );


    return false;

}


// ========================================
// Logout
// ========================================

async function logout() {

    const token =
        getAuthToken();


    try {

        if (token) {

            const response =
                await fetch(
                    `${AUTH_API_BASE}/logout`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            if (!response.ok) {

                console.warn(
                    "[Auth] Backend Logout 回應:",
                    response.status
                );

            }

        }

    } catch (error) {

        console.warn(
            "[Auth] Backend Logout 失敗:",
            error
        );

    } finally {

        localStorage.removeItem(
            "mission_center_token"
        );


        localStorage.removeItem(
            "mission_center_user"
        );


        console.log(
            "[Auth] 已登出。"
        );

    }

}


// ========================================
// Unauthorized / Token Expired
// ========================================

async function handleUnauthorized() {

    console.warn(
        "[Auth] Token 已失效，準備登出。"
    );


    await logout();


    const currentPath =
        window.location.pathname;


    // Shuttle 頁面
    if (
        currentPath.includes("/shuttle/")
    ) {

        window.location.href =
            "../index.html";

        return;

    }


    // 一般 Mission Center
    window.location.href =
        "./index.html";

}


// ========================================
// Authentication State
// ========================================

function isAuthenticated() {

    return !!getAuthToken();

}


// ========================================
// Window API
// ========================================

window.login =
    login;

window.getAuthToken =
    getAuthToken;

window.getCurrentUser =
    getCurrentUser;

window.logout =
    logout;

window.isAuthenticated =
    isAuthenticated;

window.handleUnauthorized =
    handleUnauthorized;


// ========================================
// User Session UI
// ========================================

function updateUserSessionUI() {

    const userNameElement =
        document.getElementById(
            "current-user-name"
        );


    const logoutButton =
        document.getElementById(
            "logout-btn"
        );


    if (!userNameElement) {

        return;

    }


    const user =
        getCurrentUser();


    if (!user) {

        userNameElement.textContent =
            "未登入";


        if (logoutButton) {

            logoutButton.style.display =
                "none";

        }


        return;

    }


    userNameElement.textContent =
        user.username ||
        user.name ||
        "使用者";


    if (logoutButton) {

        logoutButton.style.display =
            "inline-flex";

    }

}


// ========================================
// Logout UI
// ========================================

async function handleLogout() {

    await logout();


    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const missionCenterApp =
        document.getElementById(
            "mission-center-app"
        );


    if (missionCenterApp) {

        missionCenterApp.style.display =
            "none";

    }


    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }


    updateUserSessionUI();


    console.log(
        "[Auth] Logout UI 完成。"
    );

}


// ========================================
// Mission Center UI
// ========================================

async function showMissionCenter() {

    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const missionCenterApp =
        document.getElementById(
            "mission-center-app"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }


    if (missionCenterApp) {

        missionCenterApp.style.display =
            "";

    }


    updateUserSessionUI();


    // ========================================
    // 啟動 Mission Center
    // ========================================

    if (
        typeof setupWorkspaceTabs ===
        "function"
    ) {

        setupWorkspaceTabs();

    }


    if (
        typeof loadMissions ===
        "function"
    ) {

        await loadMissions();

    }

}


// ========================================
// Login UI
// ========================================

function initializeLoginUI() {

    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const missionCenterApp =
        document.getElementById(
            "mission-center-app"
        );


    const loginForm =
        document.getElementById(
            "login-form"
        );


    const loginError =
        document.getElementById(
            "login-error"
        );


    const loginSubmitButton =
        document.getElementById(
            "login-submit-btn"
        );


    const logoutButton =
        document.getElementById(
            "logout-btn"
        );


    if (
        !loginScreen ||
        !missionCenterApp ||
        !loginForm
    ) {

        console.warn(
            "[Auth] Login UI 元件不存在。"
        );

        return;

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    // ========================================
    // 已登入
    // ========================================

    if (isAuthenticated()) {

        // ----------------------------------------
        // 在驗證 Workspace 前，
        // 不顯示 Mission Center
        // ----------------------------------------

        loginScreen.style.display =
            "none";

        missionCenterApp.style.display =
            "none";


        (async () => {

            try {

                console.log(
                    "[Auth] 已存在 Token，重新驗證登入狀態..."
                );


                const user =
                    await getCurrentUserFromBackend();


                // ----------------------------------------
                // 使用與第一次登入完全相同的 Router
                // ----------------------------------------

                const routed =
                    routeAuthenticatedUser(
                        user
                    );


                if (routed) {

                    return;

                }


                // ----------------------------------------
                // 一般 Mission Center
                // ----------------------------------------

                await showMissionCenter();

            } catch (error) {

                console.error(
                    "[Auth] 已登入狀態驗證失敗:",
                    error
                );


                // ----------------------------------------
                // Token / Session 已失效
                // ----------------------------------------

                if (
                    error.status === 401
                ) {

                    await logout();


                    loginScreen.style.display =
                        "flex";

                    missionCenterApp.style.display =
                        "none";


                    if (loginError) {

                        loginError.textContent =
                            "登入狀態已失效，請重新登入。";

                        loginError.style.display =
                            "block";

                    }


                    return;

                }


                // ----------------------------------------
                // 其他錯誤
                //
                // 不直接刪除 Token，
                // 避免只是暫時 API / 網路問題
                // 就讓使用者被迫重新登入。
                // ----------------------------------------

                loginScreen.style.display =
                    "flex";

                missionCenterApp.style.display =
                    "none";


                if (loginError) {

                    loginError.textContent =
                        "目前無法確認登入狀態，請稍後重新整理頁面。";

                    loginError.style.display =
                        "block";

                }

            }

        })();


        return;

    }


    // ========================================
    // 尚未登入
    // ========================================

    loginScreen.style.display =
        "flex";


    missionCenterApp.style.display =
        "none";


    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const username =
                document
                    .getElementById(
                        "login-username"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "login-password"
                    )
                    .value;


            loginError.style.display =
                "none";

            loginError.textContent =
                "";


            loginSubmitButton.disabled =
                true;

            loginSubmitButton.textContent =
                "登入中...";


            try {

                const loginData =
                    await login(
                        username,
                        password
                    );


                console.log(
                    "[Auth] Login UI 登入成功。"
                );


                const user =
                    loginData.user;


                console.log(
                    "[Auth] access_context:",
                    user.access_context
                );


                // ========================================
                // Login Routing
                // ========================================

                const routed =
                    routeAuthenticatedUser(
                        user
                    );


                if (routed) {

                    return;

                }


                // ========================================
                // Mission Center
                // ========================================

                await showMissionCenter();


            } catch (error) {

                console.error(
                    "[Auth] Login UI 登入失敗:",
                    error
                );


                loginError.textContent =
                    error.message ||
                    "登入失敗，請確認帳號與密碼。";


                loginError.style.display =
                    "block";


            } finally {

                loginSubmitButton.disabled =
                    false;

                loginSubmitButton.textContent =
                    "登入系統";

            }

        }
    );

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeLoginUI();

    }
);