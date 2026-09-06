require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const missionRunService = require(
    "./modules/mission/services/missionRunService"
);

const missionRunId =
    "28e1ee2d-250e-4ae2-b39e-4a9407ffc512";

async function test() {

    try {

        console.log("Completing Mission Run...");
        console.log("Mission Run ID:", missionRunId);

        const result =
            await missionRunService.completeMissionRun(
                missionRunId
            );

        console.log("\nMission:");
        console.table(result.mission);

        console.log("\nMission Run:");
        console.table(result.missionRun);

        console.log("\nMission Run completed successfully");

    } catch (error) {

        console.error("\nMission Run completion failed");

        console.error({
            message: error.message,
            statusCode: error.statusCode
        });

        process.exitCode = 1;
    }
}

test();
