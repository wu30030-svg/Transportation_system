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

        console.log(
            "Trying to complete an ABORTED Mission Run..."
        );

        console.log(
            "Mission Run ID:",
            missionRunId
        );

        await missionRunService.completeMissionRun(
            missionRunId
        );

        console.error(
            "\nERROR: ABORTED Mission Run was incorrectly completed"
        );

        process.exitCode = 1;

    } catch (error) {

        console.log(
            "\nExpected error received"
        );

        console.log({
            message: error.message,
            statusCode: error.statusCode
        });

        console.log(
            "\nABORTED → COMPLETED correctly blocked"
        );
    }
}

test();
