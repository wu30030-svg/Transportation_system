require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const missionRunService = require(
    "./modules/mission/services/missionRunService"
);

const missionRunId =
    "f7425a27-e9fc-45a3-b250-46fe734b6f9d";

async function test() {

    try {

        console.log("Aborting Mission Run...");
        console.log("Mission Run ID:", missionRunId);

        const result =
            await missionRunService.abortMissionRun(
                missionRunId
            );

        console.log("\nMission:");
        console.table(result.mission);

        console.log("\nMission Run:");
        console.table(result.missionRun);

        console.log(
            "\nMission Run aborted successfully"
        );

    } catch (error) {

        console.error(
            "\nMission Run abort failed"
        );

        console.error({
            message: error.message,
            statusCode: error.statusCode
        });

        process.exitCode = 1;
    }
}

test();
