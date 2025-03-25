require('dotenv').config();
const express = require('express');
const { EAFCApiService } = require('eafc-clubs-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getISODate, updateDailyStatsFile, dailyStatsFilePath } = require('./utils'); // Import helpers

const app = express();
const port = process.env.PORT || 3001;
const apiService = new EAFCApiService();

app.use(cors());
app.use(express.json());

// --- Visitor Counter Middleware ---
const counterFilePath = path.join(__dirname, 'counter.txt');
let visitorCount = 0;
try {
    const data = fs.readFileSync(counterFilePath, 'utf-8');
    visitorCount = parseInt(data, 10) || 0;
} catch (error) { console.error("Error reading counter file:", error); }

app.use((req, res, next) => {
    if (req.path === '/') {
        try {
            visitorCount++;
            fs.writeFileSync(counterFilePath, visitorCount.toString(), 'utf-8');
            console.log("Visitor Count:", visitorCount);
        } catch (error) { console.error("Error writing to counter file:", error); }
    }
    next();
});

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// --- API Endpoints ---

app.get('/api/stats', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set in .env");
        }
        const stats = await apiService.overallStats({ clubIds: clubId, platform });
        console.log("Raw API Response (stats):", stats); // Log for debugging
        res.json({ stats: stats, platform: platform });
    } catch (error) {
        console.error("Error in /api/stats:", error);
        res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
    }
});

app.get('/api/members', async (req, res) => {
     try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set");
        }
        const memberStats = await apiService.memberStats({ clubId, platform });
        console.log("Raw API Response (members):", memberStats); // Log for debugging
        res.json(memberStats);
    } catch (error) {
        console.error("Error fetching member stats:", error);
        res.status(500).json({ error: 'Failed to fetch member stats', message: error.message});
    }
});

app.get('/api/guestbook', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'guestbook.json');
        console.log("Guestbook file path:", filePath);
        const data = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(data);
        res.json(entries);
    } catch (error) {
        console.error("Error reading guestbook:", error);
        res.status(500).json({ error: 'Failed to read guestbook' });
    }
});

app.post('/api/guestbook', (req, res) => {
    try {
        const { name, message } = req.body;
        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }
        const filePath = path.join(__dirname, 'guestbook.json');
        console.log("Guestbook file path:", filePath);
        const data = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(data);
        const newEntry = {
            id: entries.length > 0 ? entries[entries.length - 1].id + 1 : 1,
            name: name,
            message: message,
            timestamp: new Date().toISOString()
        };
        entries.push(newEntry);
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
        res.status(201).json(newEntry);
    } catch (error) {
        console.error("Error adding to guestbook:", error);
        res.status(500).json({ error: 'Failed to add entry to guestbook' });
    }
});

app.get('/api/count', (req, res) => {
      try {
        res.json(visitorCount);
    } catch (error) {
        console.error("Error getting count:", error);
        res.status(500).json({ error: 'Failed to get count', message: error.message });
    }
});

// Daily Changes API Route (for client-side display)
app.get('/api/daily_changes', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set");
        }

        // Fetch Current Stats for comparison
        let currentMemberStatsData;
        try {
            currentMemberStatsData = await apiService.memberStats({ clubId, platform });
            if (!currentMemberStatsData || !currentMemberStatsData.members) {
                throw new Error("Invalid data format received from memberStats API.");
            }
        } catch (apiError) {
             console.error("Error fetching current stats for /api/daily_changes:", apiError);
             return res.json({}); // Return empty changes if current fetch fails
        }

        // Read Historical Stats
        let dailyStats = {};
        try {
            const data = fs.readFileSync(dailyStatsFilePath, 'utf-8');
            dailyStats = JSON.parse(data);
        } catch (readError) {
            if (readError.code !== 'ENOENT') { console.error("Error reading daily_stats.json:", readError); }
        }

        // Get Dates
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = getISODate(yesterday);
        const yesterdayStats = dailyStats[yesterdayStr] || {};

        // Calculate Changes based on CURRENT vs YESTERDAY's SNAPSHOT
        const changes = {};
        for (const member of currentMemberStatsData.members) {
            const name = member.name;
            const currentGoals = parseInt(member.goals, 10) || 0;
            const currentAssists = parseInt(member.assists, 10) || 0;
            const prevStats = yesterdayStats[name] || { goals: currentGoals, assists: currentAssists };
            const prevGoals = prevStats.goals || 0;
            const prevAssists = prevStats.assists || 0;

            changes[name] = {
                newGoals: Math.max(0, currentGoals - prevGoals),
                newAssists: Math.max(0, currentAssists - prevAssists)
            };
        }
        res.json(changes); // Respond with calculated changes

    } catch (error) {
        console.error("Error in /api/daily_changes:", error);
        res.status(500).json({ error: 'Failed to calculate daily changes', message: error.message });
    }
});

// --- Secret Trigger Endpoint for Daily Update ---
let isUpdatingStats = false; // Prevent concurrent updates

async function performDailyUpdate(todayStr) {
    if (isUpdatingStats) {
        console.log(`[${getISODate()}] Daily update already in progress. Skipping.`);
        return false; // Indicate already running
    }
    isUpdatingStats = true;
    console.log(`[${getISODate()}] Triggering daily stats update via endpoint for ${todayStr}...`);

    const clubId = process.env.CLUB_ID;
    const platform = process.env.PLATFORM;
    if (!clubId || !platform) {
        console.error("Error: Cannot perform daily update, CLUB_ID and PLATFORM env vars missing.");
        isUpdatingStats = false;
        return false;
    }

    try {
        const currentMemberStatsData = await apiService.memberStats({ clubId, platform });
        const success = updateDailyStatsFile(currentMemberStatsData, null, todayStr); // Reads existing daily_stats.json internally

        if (success) {
            // Only update last_update.txt if stats were successfully saved
             const lastUpdateFilePath = path.join(__dirname, 'last_update.txt'); // Define path here
             fs.writeFileSync(lastUpdateFilePath, todayStr, 'utf-8');
             console.log(`[${getISODate()}] Successfully updated last_update.txt to ${todayStr}`);
        } else {
             console.warn(`[${getISODate()}] Daily stats snapshot was not saved. last_update.txt not updated.`);
        }
        return success; // Return success status

    } catch (error) {
        console.error(`[${getISODate()}] Error during triggered daily stats update:`, error);
        return false; // Return failure status
    } finally {
        isUpdatingStats = false; // Release the lock
    }
}

app.get('/api/trigger-daily-update', async (req, res) => {
    const secret = process.env.UPDATE_SECRET || "default_very_secret_code"; // Use an env variable! Remember to set this in Render
    if (req.query.secret !== secret) {
        console.warn("Attempted access to trigger update with incorrect secret.");
        return res.status(403).send("Forbidden");
    }

    // Optional: Check if already updated today to avoid redundant runs
    const lastUpdateFilePath = path.join(__dirname, 'last_update.txt');
    let lastUpdateDateStr = '';
    try {
        lastUpdateDateStr = fs.readFileSync(lastUpdateFilePath, 'utf-8').trim();
    } catch (e) { /* Ignore read error, will proceed */ }

    const todayStr = getISODate();
    if (lastUpdateDateStr === todayStr) {
         console.log(`[${getISODate()}] Daily update already performed today. Trigger ignored.`);
         return res.status(200).send(`Update already performed for ${todayStr}.`);
    }

    // Trigger the update (don't wait for it to finish)
    performDailyUpdate(todayStr).then(success => {
        console.log(`[${getISODate()}] Background update trigger result: ${success ? 'Success' : 'Failed/Skipped'}`);
    }).catch(err => {
        console.error(`[${getISODate()}] Unhandled error from background performDailyUpdate:`, err);
    });

    // Respond immediately to the cron job / manual trigger
    res.status(202).send(`Daily update triggered for ${todayStr}. Check server logs for completion.`);
});


// --- Fallback Routes ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});