const authService = require("../services/authService");

async function login(req, res) {
    try {
        const { username, password } = req.body;

        const user = await authService.login(
            username,
            password
        );

        return res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

module.exports = {
    login
};