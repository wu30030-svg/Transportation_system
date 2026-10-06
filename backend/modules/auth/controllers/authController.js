const authService = require("../services/authService");


// ========================================
// Login
// ========================================

async function login(req, res) {

    try {

        const {
            username,
            password
        } = req.body;


        const user =
            await authService.login(
                username,
                password
            );


        return res.status(200).json({

            success: true,

            data: user

        });

    } catch (error) {

        console.error(
            "Login Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

        });

    }
}


// ========================================
// Current User
// ========================================

async function me(req, res) {

    try {

        const userId =
            req.user?.user_id;


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid session"

            });

        }


        const user =
            await authService.getCurrentUser(
                userId
            );


        return res.status(200).json({

            success: true,

            data: {

                user

            }

        });

    } catch (error) {

        console.error(
            "Current User Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

        });

    }
}


// ========================================
// Logout
// ========================================

async function logout(req, res) {

    try {

        const sessionId =
            req.user?.session_id;


        if (!sessionId) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid session"

            });

        }


        await authService.logout(
            sessionId
        );


        return res.status(200).json({

            success: true,

            message:
                "Logout successful"

        });

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );


        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal Server Error"

        });

    }
}


module.exports = {

    login,

    me,

    logout

};