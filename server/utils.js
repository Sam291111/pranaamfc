// server/utils.js
const fs = require('fs');
const path = require('path');

const dailyStatsFilePath = path.join(__dirname, 'daily_stats.json');

// Helper function to get YYYY-MM-DD date string
function getISODate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// Helper function to update the daily stats file
function updateDailyStatsFile(currentMemberStatsData, dailyStats = null, todayStr = getISODate()) {
    if (!currentMemberStatsData || !currentMemberStatsData.members) {
        console.warn(`[${getISODate()}] Skipping daily stats update: Invalid current member data.`);
        return false; // Indicate failure/skip
    }

    // Read existing data if not provided
    if (dailyStats === null) {
         dailyStats = {};
         try {
             const data = fs.readFileSync(dailyStatsFilePath, 'utf-8');
             dailyStats = JSON.parse(data);
         } catch (readError) {
             if (readError.code === 'ENOENT') {
                 console.log(`[${getISODate()}] daily_stats.json not found for update, starting fresh.`);
             } else {
                 console.error(`[${getISODate()}] Error reading daily_stats.json for update:`, readError);
                 // Don't necessarily stop, maybe we can still write today's data
             }
         }
    }

    try {
        const todayStatsSnapshot = {};
        for (const member of currentMemberStatsData.members) {
            todayStatsSnapshot[member.name] = { // Use API name as key
                goals: parseInt(member.goals, 10) || 0,
                assists: parseInt(member.assists, 10) || 0
            };
        }

        if (Object.keys(todayStatsSnapshot).length > 0) {
            dailyStats[todayStr] = todayStatsSnapshot;
            // Optional: Clean up old data here if needed (e.g., keep only last 30 days)
            fs.writeFileSync(dailyStatsFilePath, JSON.stringify(dailyStats, null, 2), 'utf-8');
            console.log(`[${getISODate()}] Updated daily stats file for ${todayStr}`);
            return true; // Indicate success
        } else {
             console.warn(`[${getISODate()}] No stats snapshot generated for today, not updating file.`);
             return false; // Indicate skip
        }
    } catch (writeError) {
        console.error(`[${getISODate()}] Error writing daily_stats.json:`, writeError);
        return false; // Indicate failure
    }
}

module.exports = {
    getISODate,
    updateDailyStatsFile,
    dailyStatsFilePath
};