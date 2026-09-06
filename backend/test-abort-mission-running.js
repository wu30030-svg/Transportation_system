require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const missionRunService = require(
    "./modules/mission/services/missionRunService"
);

const missionId =
    "c254a270-cdf9-42ad-a55a-b230895e3b52";

async function test() {

    try {

        console.log("Starting Mission Run...");
        console.log("Mission ID:", missionId);

        const result =
            await missionRunService.startMissionRun(
                missionId
            );

        console.log("\nMission:");
        console.table(result.mission);

        console.log("\nMission Run:");
        console.table(result.missionRun);

        console.log(
            "\nMission Run started successfully"
        );

    } catch (error) {

        console.error(
            "\nMission Run start failed"
        );

        console.error({
            message: error.message,
            statusCode: error.statusCode
        });

        process.exitCode = 1;
    }
}

test();
