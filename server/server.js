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

// --- Visitor Counter Middleware ---
const counterFilePath = path.join(__dirname, 'counter.txt');
let visitorCount = 0;

// Read initial count (synchronously, on startup)
try {
    const data = fs.readFileSync(counterFilePath, 'utf-8');
    visitorCount = parseInt(data, 10) || 0;
} catch (error) {
    console.error("Error reading counter file:", error);
    // If there's an error (file doesn't exist, etc.), we'll start at 0.
}

// Middleware to increment the counter on EVERY request.
app.use((req, res, next) => {
  // We increment for ALL requests, not just '/'.
  try {
    visitorCount++;
    fs.writeFileSync(counterFilePath, visitorCount.toString(), 'utf-8');
    //console.log("Visitor Count:", visitorCount); // Debugging
  } catch (error) {
    console.error("Error writing to counter file:", error);
  }
  next(); // VERY IMPORTANT: Call next() to continue to other middleware/routes
});

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
        const filePath = path.join(__dirname, 'guestbook.json'); //create a variable
        console.log("Guestbook file path:", filePath); // Log the path

        const data = fs.readFileSync(filePath, 'utf-8');
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
        const filePath = path.join(__dirname, 'guestbook.json');
        console.log("Guestbook file path:", filePath);

        const data = fs.readFileSync(filePath, 'utf-8');
        const entries = JSON.parse(data);

        const newEntry = {
            id: entries.length > 0 ? entries[entries.length - 1].id + 1 : 1, // Simple incrementing ID
            name: name,
            message: message,
            timestamp: new Date().toISOString() // ISO 8601 format
        };

        entries.push(newEntry);
        fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8'); // Write back to file

        res.status(201).json(newEntry); // Return the new entry (good practice)

    } catch (error) {
        console.error("Error adding to guestbook:", error);
        res.status(500).json({ error: 'Failed to add entry to guestbook' });
    }
});

// New API route, to send count to the client
app.get('/api/count', (req, res) =>{
    try{
        res.json(visitorCount)
    }
     catch (error) {
        console.error("Error getting count:", error);
        res.status(500).json({ error: 'Failed to get count', message: error.message });
    }
})

// Explicitly serve index.html for the root route AFTER the middleware.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});