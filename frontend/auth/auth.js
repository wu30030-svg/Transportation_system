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
        user.username || user.name || "使用者";

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
// Login UI
// ========================================

function initializeLoginUI() {

    const loginScreen =
        document.getElementById("login-screen");

    const missionCenterApp =
        document.getElementById("mission-center-app");

    const loginForm =
        document.getElementById("login-form");

    const loginError =
        document.getElementById("login-error");

    const loginSubmitButton =
        document.getElementById("login-submit-btn");

    const logoutButton =
        document.getElementById("logout-btn");


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

        loginScreen.style.display =
            "none";

        missionCenterApp.style.display =
            "";

        updateUserSessionUI();

        return;

    }


    // ========================================
    // 尚未登入
    // ========================================

    loginScreen.style.display = "flex";
    missionCenterApp.style.display = "none";


    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const username =
                document
                    .getElementById("login-username")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("login-password")
                    .value;


            loginError.style.display = "none";
            loginError.textContent = "";


            loginSubmitButton.disabled = true;
            loginSubmitButton.textContent =
                "登入中...";


            try {

                const loginData = await login(
                    username,
                    password
                );

                console.log(
                    "[Auth] Login UI 登入成功。"
                );

                const user = loginData.user;

                console.log(
                    "[Auth] access_context:",
                    user.access_context
                );


                // ========================================
                // Login Routing
                // ========================================

                // ========================================
                // Shuttle Monitor
                // ========================================

                if (
                    Number(user.role_id) === 6 &&
                    user.access_context
                ) {

                    console.log(
                        "[Auth] → Shuttle Monitor:",
                        user.access_context
                    );

                    // ----------------------------------------
                    // Shuttle Monitor
                    // ----------------------------------------

                    if (
                        user.access_context === "營區開放_A路線" ||
                        user.access_context === "營區開放_B路線" ||
                        user.access_context === "營區開放_C路線"
                    ) {

                        window.location.href =
                            "./shuttle/shuttle-monitor.html";

                        return;

                    }
                }
                // ========================================
                // Shuttle Driver
                // ========================================

                if (
                    Number(user.role_id) === 4 &&
                    user.access_context
                ) {

                    console.log(
                        "[Auth] → Shuttle Driver:",
                        user.access_context
                    );

                    window.location.href =
                        "./shuttle/shuttle-driver.html";

                    return;

                }


                // ========================================
                // Mission Center
                // ========================================

                console.log(
                    "[Auth] → Mission Center"
                );

                loginScreen.style.display =
                    "none";

                missionCenterApp.style.display =
                    "";

                updateUserSessionUI();


                // ========================================
                // 登入成功後啟動 Mission Center
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