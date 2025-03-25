// server/cron-update-stats.js
require('dotenv').config(); // Load environment variables
const { EAFCApiService } = require('eafc-clubs-api');
const { updateDailyStatsFile } = require('./utils'); // Import the helper

const apiService = new EAFCApiService();

async function runDailyUpdate() {
    console.log(`[${new Date().toISOString()}] Starting daily stats update cron job...`);
    const clubId = process.env.CLUB_ID;
    const platform = process.env.PLATFORM;

    if (!clubId || !platform) {
        console.error("Error: CLUB_ID and PLATFORM environment variables must be set.");
        process.exit(1); // Exit with error code
    }

    try {
        // 1. Fetch Current Stats
        const currentMemberStatsData = await apiService.memberStats({ clubId, platform });

        // 2. Update the daily stats file using the helper
        const success = updateDailyStatsFile(currentMemberStatsData); // Reads existing file internally

        if (success) {
            console.log(`[${new Date().toISOString()}] Daily stats update completed successfully.`);
        } else {
             console.warn(`[${new Date().toISOString()}] Daily stats update may have been skipped or failed.`);
        }
        process.exit(0); // Exit successfully

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during daily stats update:`, error);
        process.exit(1); // Exit with error code
    }
}

runDailyUpdate(); // Execute the update function