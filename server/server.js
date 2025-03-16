require('dotenv').config();
const express = require('express');
const { EAFCApiService } = require('eafc-clubs-api');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import the 'fs' module (File System)

const app = express();
const port = process.env.PORT || 3001;
const apiService = new EAFCApiService();

app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// API endpoint to get overall club stats
app.get('/api/stats', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set in .env");
        }

        // Construct the URL manually (for debugging) and log it
        const baseUrl = 'https://proclubs.ea.com/api/fc/';
        const endpoint = 'clubs/overallStats';
        const url = new URL(endpoint, baseUrl);
        url.searchParams.append('clubIds', clubId);
        url.searchParams.append('platform', platform);

        console.log("Constructed URL:", url.toString()); // Log the FULL URL

        // Use the apiService to fetch data.
        let stats;
        try {
            stats = await apiService.overallStats({ clubIds: clubId, platform });
        } catch (error) {
            console.error("Error within the apiService:", error);
            return res.status(500).json({ error: "Failed to fetch data from the API", message: error.message });
        }

        // Log the raw API response (important for debugging)
        console.log("Raw API Response (stats):", stats);

        // Send stats AND platform
         res.json({ stats: stats, platform: platform });


    } catch (error) {
        console.error("Error in /api/stats:", error);
        res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
    }
});

// API endpoint to get member stats
app.get('/api/members', async (req, res) => {
    try {
        const clubId = process.env.CLUB_ID;
        const platform = process.env.PLATFORM;
        if (!clubId || !platform) {
            throw new Error("CLUB_ID and PLATFORM must be set");
        }
         // Construct URL and log (for debugging - you can add this to other routes too)
        const baseUrl = 'https://proclubs.ea.com/api/fc/';
        const endpoint = 'members/stats';
        const url = new URL(endpoint, baseUrl);
        url.searchParams.append('clubId', clubId);
        url.searchParams.append('platform', platform);
        console.log("Constructed URL (members):", url.toString());
        console.log(`Fetching members for clubId: ${clubId}, platform: ${platform}`);

        let memberStats;
        try {
          memberStats = await apiService.memberStats({ clubId, platform });
        }
        catch(error){
          console.error("Error within the apiService:", error)
          return res.status(500).json({error: "Failed to fetch data from the API", message: error.message})
        }

        // Log the raw response BEFORE parsing it as JSON:
        console.log("Raw API Response (members):", memberStats);

        res.json(memberStats);
    } catch (error) {
        console.error("Error in /api/members:", error);
        res.status(500).json({ error: 'Failed to fetch member stats', message: error.message});
    }
});

// --- Guestbook API Endpoints ---

// GET /api/guestbook:  Get all guestbook entries
app.get('/api/guestbook', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'guestbook.json'), 'utf-8');
        const entries = JSON.parse(data);
        res.json(entries);
    } catch (error) {
        console.error("Error reading guestbook:", error);
        res.status(500).json({ error: 'Failed to read guestbook' });
    }
});

// POST /api/guestbook: Add a new guestbook entry
app.post('/api/guestbook', (req, res) => {
    try {
        const { name, message } = req.body;

        if (!name || !message) {
            return res.status(400).json({ error: 'Name and message are required' });
        }

        const data = fs.readFileSync(path.join(__dirname, 'guestbook.json'), 'utf-8');
        const entries = JSON.parse(data);

        const newEntry = {
            id: entries.length > 0 ? entries[entries.length - 1].id + 1 : 1, // Simple incrementing ID
            name: name,
            message: message,
            timestamp: new Date().toISOString() // ISO 8601 format
        };

        entries.push(newEntry);
        fs.writeFileSync(path.join(__dirname, 'guestbook.json'), JSON.stringify(entries, null, 2), 'utf-8'); // Write back to file

        res.status(201).json(newEntry); // Return the new entry (good practice)

    } catch (error) {
        console.error("Error adding to guestbook:", error);
        res.status(500).json({ error: 'Failed to add entry to guestbook' });
    }
});

// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});